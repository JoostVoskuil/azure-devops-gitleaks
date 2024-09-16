import fs = require('node:fs')
import Path = require('node:path')
import * as toolLib from 'azure-pipelines-tool-lib/tool'
import * as restClient from 'typed-rest-client/RestClient'
import * as httpClient from 'typed-rest-client/HttpClient'
import taskLib = require('azure-pipelines-task-lib/task')
import { getAzureDevOpsInput, getAzureDevOpsVariable, getRequestOptions } from './helpers'
import type { IHttpClientResponse } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'

export class GitleaksTool {
  constructor () {
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  async getGitLeaksTool (): Promise<string> {
    const specifiedVersion = getAzureDevOpsInput('version')
    const customtoollocationInput = taskLib.getPathInput('customtoollocation')
    const customtoollocationVariabele = taskLib.getVariable('AGENT_TOOLSGITLEAKSDIRECTORY')
    if (customtoollocationInput !== undefined) { 
      return await this.getToolFromCustomLocation(customtoollocationInput) 
    }
    if (customtoollocationVariabele !== undefined) {
      return await this.getToolFromCustomLocation(customtoollocationVariabele) 
    }
    
      return await this.getToolFromAgent(specifiedVersion) 
  }

  private async getToolFromCustomLocation (customToolLocation: string): Promise<string> {
    const toolExecutable = this.getGitleaksExecutableFileName()
    const toolLocation = Path.join(customToolLocation, toolExecutable)
    if (taskLib.exist(toolLocation)) return toolLocation
    throw new Error(taskLib.loc('GitLeaksNotFound', toolLocation))
  }

  private async getToolFromAgent (specifiedVersion: string): Promise<string> {
    const isGitHubAvailable = await this.detectIfGitHubIsReachable()

    // Detect minimal version of Gitleaks supported is version 8
    if (specifiedVersion.toLowerCase() !== 'latest') {
      const version = toolLib.cleanVersion(specifiedVersion)
      const semver = version.split('.')
      if (Number(semver[0]) !== 8 ) throw Error(taskLib.loc('OnlySupportsGitLeaks8', version))
    }

    if (!isGitHubAvailable) {
      return await this.getToolFromOfflineAgent(specifiedVersion)
    }if (specifiedVersion.toLowerCase() === 'latest') {
      return await this.getToolFromOnlineAgentBasedOnLatest(specifiedVersion.toLowerCase())
    }
      return await this.getToolFromOnlineAgentBasedOnVersion(specifiedVersion)
  }

  private async findToolVersionOnAgent (version: string): Promise<string | undefined> {
    const cachedVersionsbyAgent = toolLib.findLocalToolVersions('gitleaks')
    if (cachedVersionsbyAgent === undefined || cachedVersionsbyAgent.length === 0) return undefined
    taskLib.debug(taskLib.loc('CachedVersions', cachedVersionsbyAgent))
    if (version.toLowerCase() === 'latest') {
      return (cachedVersionsbyAgent.sort((one, two) => (one > two ? -1 : 1)))[0]
    }
      return cachedVersionsbyAgent.find(x => x === toolLib.cleanVersion(version))
  }

  private async getToolFromOfflineAgent (version: string): Promise<string> {
    const toolExecutable: string = this.getGitleaksExecutableFileName()
    console.log(taskLib.loc('OfflineAgent'))
    const latestVersionAvailableOnAgent: string | undefined = await this.findToolVersionOnAgent(version)
    if (latestVersionAvailableOnAgent === undefined) throw new Error(taskLib.loc('OfflineAgentToolNotAvailable'))
    const cachedToolDirectory = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnAgent)
    return Path.join(cachedToolDirectory, toolExecutable)
  }

  private async getToolFromOnlineAgentBasedOnLatest (version: string): Promise<string> {
    // Try to get the easyest way through the latest page
    let latestVersionAvailableOnGitHub = await this.getLatestToolVersionFromGitHub()
    // If version cannot be retrieved from latest page, use API
    if (latestVersionAvailableOnGitHub === undefined) {
      latestVersionAvailableOnGitHub =  await this.getLatestToolVersionFromGitHubAPI()
    }
    
    if (latestVersionAvailableOnGitHub === undefined) throw new Error(taskLib.loc('CouldNotQueryGitLeaksLatestVersion'))

    const toolExecutable: string = this.getGitleaksExecutableFileName()
    const versionOnAgent: string | undefined = await this.findToolVersionOnAgent(version)

    if (versionOnAgent !== undefined && versionOnAgent === latestVersionAvailableOnGitHub) {
      console.log(taskLib.loc('OnlineAgentHasLatestVersion', latestVersionAvailableOnGitHub))
      const cachedToolDirectory: string = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnGitHub)
      return Path.join(cachedToolDirectory, toolExecutable)
    }
      console.log(taskLib.loc('OnlineAgentHasNotTheLatestVersion', latestVersionAvailableOnGitHub))
      return await this.downloadGitLeaks(latestVersionAvailableOnGitHub)
  }

  private async getToolFromOnlineAgentBasedOnVersion (version): Promise<string> {
    const toolExecutable = this.getGitleaksExecutableFileName()
    const versionOnAgent = await this.findToolVersionOnAgent(version)
    if (versionOnAgent !== undefined && versionOnAgent === toolLib.cleanVersion(version)) {
      console.log(taskLib.loc('AvailableInToolcache', version))
      const cachedToolDirectory = toolLib.findLocalTool('gitleaks', toolLib.cleanVersion(version))
      return Path.join(cachedToolDirectory, toolExecutable)
    }
      console.log(taskLib.loc('NoToolcacheDownloading', version, version))
      return await this.downloadGitLeaks(toolLib.cleanVersion(version))
  }

  private getDownloadFileName (version: string): string {
    const operatingSystem = getAzureDevOpsVariable('Agent.OS')
    const architecture = getAzureDevOpsVariable('Agent.OSArchitecture')

    if ((operatingSystem === 'Windows_NT') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_windows_x64.zip`
    if ((operatingSystem === 'Windows_NT') && (architecture.toLowerCase() === 'x86')) return `gitleaks_${version}_windows_x32.zip`
    if ((operatingSystem === 'Darwin') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_darwin_x64.tar.gz`
    if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_linux_x64.tar.gz`
    if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'x86')) return `gitleaks_${version}_linux_x32.tar.gz`
    if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'arm')) return `gitleaks_${version}_linux_armv7.tar.gz`
    throw new Error(taskLib.loc('OsArchNotSupported', operatingSystem, architecture, 'gitleaks'))
  }


  private async getLatestToolVersionFromGitHub (): Promise<string | undefined> {
    console.log(taskLib.loc('QueryingGitHubLatestReleasePage'))
    try {
      // Get information from github
      const url = 'https://github.com/gitleaks/gitleaks/releases/latest'
      const http: httpClient.HttpClient  = new httpClient.HttpClient('vsts-node-tool')
      
      const response: httpClient.HttpClientResponse = await http.get(url, getRequestOptions())
      if (response.message.statusCode !== 200) throw new Error(taskLib.loc('CannotRetrieveVersion'))
      // biome-ignore lint/suspicious/noExplicitAny : just skip
      const path = (response.message as any).req.path
      
      const version: string = path.split('/v')[1]
      
      if (version.startsWith('8')) {
        taskLib.debug(taskLib.loc('ReleaseInfo', version))
        return version
      }
    }
    catch (error) {
      console.log(taskLib.loc('ErrorFetchingGitHub', error.message))
    }
    return undefined
  }

  private async getLatestToolVersionFromGitHubAPI (): Promise<string | undefined> {
    console.log(taskLib.loc('QueryingGitHubAPI'))
    try {
      // Get information from github
      const url = 'https://api.github.com/repos/zricethezav/gitleaks/releases'
      const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool', undefined, undefined, getRequestOptions())
      const gitHubReleases = (await rest.get<GitHubRelease[]>(url)).result
      if (gitHubReleases === null) throw new Error(taskLib.loc('CannotRetrieveVersion'))
      // filter only gitleaks 8
      const filteredVersions = gitHubReleases.filter(x=>x.name.startsWith('v8'))
      // sort releases and get top release as latest
      const sortedVersions = filteredVersions.sort(sortSemanticVersions('name'))
      let version = sortedVersions[sortedVersions.length -1].name // Pick last one
      version = version.substring(1, version.length) //remove v
      taskLib.debug(taskLib.loc('ReleaseInfo', version))
      return version
    }
    catch (error) {
      return undefined
    }
  }

  private getGitleaksExecutableFileName (): string {
    if (getAzureDevOpsVariable('Agent.OS') === 'Windows_NT') return 'gitleaks.exe'
    return 'gitleaks'
  }

  private async downloadGitLeaks (version: string): Promise<string> {
    // Download, extract and cache tool
    const url = `https://github.com/zricethezav/gitleaks/releases/download/v${version}/${this.getDownloadFileName(version)}`
    const temp = await toolLib.downloadTool(url)
    taskLib.debug(taskLib.loc('Downloading', url))
    let extractedToolLocation: string
    if (getAzureDevOpsVariable('Agent.OS') === 'Windows_NT') {
      extractedToolLocation = Path.join(await toolLib.extractZip(temp), this.getGitleaksExecutableFileName())
    } else {
      extractedToolLocation = Path.join(await toolLib.extractTar(temp), this.getGitleaksExecutableFileName())
    }
    const cachedToolDirectory = await toolLib.cacheFile(extractedToolLocation, this.getGitleaksExecutableFileName(), 'gitleaks', version)
    const cachedToolFullPath = Path.join(cachedToolDirectory, this.getGitleaksExecutableFileName())
    taskLib.debug(taskLib.loc('cachedToolExecutable', cachedToolFullPath))

    // Set permissions
    if ((getAzureDevOpsVariable('Agent.OS') !== 'Windows_NT')) fs.chmodSync(cachedToolFullPath, '700')
    return cachedToolFullPath
  }

  private async detectIfGitHubIsReachable (): Promise<boolean> {
    let result: IHttpClientResponse
    try {
      const http: httpClient.HttpClient = new httpClient.HttpClient('vsts-node-tool', undefined, getRequestOptions())
      result = await http.get('https://github.com')
      if (result.message.statusCode !== undefined && result.message.statusCode >= 200 && result.message.statusCode < 300) return true
      return false
    } catch (err) {
      return false
    }
  }
}

interface GitHubRelease {
  name: string
}

const sortSemanticVersions = (key: string) => (a, b) => {
  // remove v prefix
  const tmpa = a[ key ].substring(1, a[key].length)
  const tmpb = b[ key ].substring(1, b[key].length)
  
  const a1 = tmpa.split('.');
  const b1 = tmpb.split('.');

  // 2. Contingency in case there's a 4th or 5th version
  const len = Math.min(a1.length, b1.length);
  // 3. Look through each version number and compare.
  for (let i = 0; i < len; i++) {
      const a2 = +a1[ i ] || 0;
      const b2 = +b1[ i ] || 0;
      
      if (a2 !== b2) {
          return a2 > b2 ? 1 : -1;        
      }
  }
  
  // 4. We hit this if the all checked versions so far are equal
  return b1.length - a1.length;
};