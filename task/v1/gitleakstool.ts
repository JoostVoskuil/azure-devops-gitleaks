import fs = require('fs')
import Path = require('path')
import * as toolLib from 'azure-pipelines-tool-lib/tool'
import * as restClient from 'typed-rest-client/RestClient'
import * as httpClient from 'typed-rest-client/HttpClient'
import taskLib = require('azure-pipelines-task-lib/task')
import { getAzureDevOpsInput, getAzureDevOpsVariable, getRequestOptions } from './helpers'
import { IHttpClientResponse } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
export class GitleaksTool {
  constructor() {
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  async getGitLeaksTool(): Promise<string> {
    const specifiedVersion = getAzureDevOpsInput('version')
    const customtoollocation = taskLib.getInput('customtoollocation')
    if (customtoollocation === undefined) {
      return await this.getToolFromAgent(specifiedVersion)
    } else {
      return await this.getToolFromCustomLocation(customtoollocation)
    }
  }

  private async getToolFromCustomLocation(customToolLocation: string): Promise<string> {
    const toolExecutable = this.getToolFileName()
    const toolLocation = Path.join(customToolLocation, toolExecutable)
    if (taskLib.exist(toolLocation)) return toolLocation
    throw new Error(taskLib.loc('GitLeaksNotFound', toolLocation))
  }

  private async findToolVersionOnAgent(version: string): Promise<string | undefined> {
    const cachedVersionsbyAgent = toolLib.findLocalToolVersions('gitleaks')
    if (cachedVersionsbyAgent === undefined || cachedVersionsbyAgent.length === 0) return undefined
    taskLib.debug(taskLib.loc('CachedVersions', cachedVersionsbyAgent))
    if (version.toLowerCase() === 'latest') {
      const latestAllowedMajorRelease = '7'
      const allowedReleases = cachedVersionsbyAgent.filter(a => a.startsWith(latestAllowedMajorRelease))
      return (allowedReleases.sort((one, two) => (one > two ? -1 : 1)))[0]
    } else {
      return cachedVersionsbyAgent.find(x => x === toolLib.cleanVersion(version))
    }
  }

  private async getToolFromOfflineAgent(version: string): Promise<string> {
    const toolExecutable = this.getToolFileName()
    console.log(taskLib.loc('OfflineAgent'))
    const latestVersionAvailableOnAgent = await this.findToolVersionOnAgent(version)
    if (latestVersionAvailableOnAgent === undefined) throw new Error(taskLib.loc('OfflineAgentToolNotAvailable'))
    const cachedToolDirectory = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnAgent)
    return Path.join(cachedToolDirectory, toolExecutable)
  }

  private async getToolFromOnlineAgentBasedOnLatest(version): Promise<string> {
    const toolExecutable = this.getToolFileName()
    const latestVersionAvailableOnGitHub = await this.getLatestToolVersionFromGitHub()
    const versionOnAgent = await this.findToolVersionOnAgent(version)
    if (versionOnAgent !== undefined && versionOnAgent === latestVersionAvailableOnGitHub) {
      console.log(taskLib.loc('OnlineAgentHasLatestVersion', latestVersionAvailableOnGitHub))
      const cachedToolDirectory = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnGitHub)
      return Path.join(cachedToolDirectory, toolExecutable)
    } else {
      console.log(taskLib.loc('OnlineAgentHasNotTheLatestVersion', latestVersionAvailableOnGitHub))
      return await this.downloadGitLeaks(latestVersionAvailableOnGitHub, toolExecutable)
    }
  }

  private async getToolFromOnlineAgentBasedOnVersion(version): Promise<string> {
    const toolExecutable = this.getToolFileName()
    const versionOnAgent = await this.findToolVersionOnAgent(version)
    if (versionOnAgent !== undefined && versionOnAgent === toolLib.cleanVersion(version)) {
      console.log(taskLib.loc('AvailableInToolcache', version))
      const cachedToolDirectory = toolLib.findLocalTool('gitleaks', toolLib.cleanVersion(version))
      return Path.join(cachedToolDirectory, toolExecutable)
    } else {
      console.log(taskLib.loc('NoToolcacheDownloading', version, version))
      return await this.downloadGitLeaks(toolLib.cleanVersion(version), toolExecutable)
    }
  }

  private async getToolFromAgent(specifiedVersion: string): Promise<string> {
    const isGitHubAvailable = await this.detectIfGitHubIsReachable()
    if (!isGitHubAvailable) {
      return await this.getToolFromOfflineAgent(specifiedVersion)
    } else if (specifiedVersion.toLowerCase() === 'latest') {
      return await this.getToolFromOnlineAgentBasedOnLatest(specifiedVersion.toLowerCase())
    } else {
      return await this.getToolFromOnlineAgentBasedOnVersion(specifiedVersion)
    }
  }

  private getToolFileName(): string {
    const operatingSystem = getAzureDevOpsVariable('Agent.OS')
    const architecture = getAzureDevOpsVariable('Agent.OSArchitecture')

    if ((operatingSystem === 'Windows_NT') && (architecture.toLowerCase() === 'x64')) return 'gitleaks-windows-amd64.exe'
    else if ((operatingSystem === 'Windows_NT') && (architecture.toLowerCase() === 'x86')) return 'gitleaks-windows-386.exe'
    else if ((operatingSystem === 'Darwin') && (architecture.toLowerCase() === 'x64')) return 'gitleaks-darwin-amd64'
    else if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'x64')) return 'gitleaks-linux-amd64'
    else if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'arm')) return 'gitleaks-linux-arm'
    else throw new Error(taskLib.loc('OsArchNotSupported', operatingSystem, architecture, 'gitleaks'))
  }

  private async getLatestToolVersionFromGitHub(): Promise<string> {
    const latestAllowedMajorRelease = 'v7'
    const url = 'https://api.github.com/repos/zricethezav/gitleaks/releases'
    const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool', undefined, undefined, getRequestOptions())
    const gitHubReleases = (await rest.get<GitHubRelease[]>(url)).result
    if (gitHubReleases === null) throw new Error(taskLib.loc('CannotRetrieveVersion', url))
    // filter allowed latest major release
    const allowedReleases = gitHubReleases.filter(a => a.name.startsWith(latestAllowedMajorRelease))

    // sort releases and get top release as latest
    const sortedVersions = allowedReleases.sort(sortSemanticVersions('name'))
    if (sortedVersions === null) throw new Error(taskLib.loc('CannotRetrieveVersion', url))
    const version = sortedVersions[sortedVersions.length -1].name // Pick last one
    taskLib.debug(taskLib.loc('ReleaseInfo', version))
    return version
  }

  private async downloadGitLeaks(version: string, executable: string): Promise<string> {
    const url = `https://github.com/zricethezav/gitleaks/releases/download/v${version}/${executable}`
    const fileGUID = await toolLib.downloadTool(url)
    const cachedToolDirectory = await toolLib.cacheFile(fileGUID, executable, 'gitleaks', version)
    const cachedToolPullPath = Path.join(cachedToolDirectory, executable)
    taskLib.debug(`cachedToolExecutable: ${cachedToolPullPath}`)
    // Set permissions
    const operatingSystem = getAzureDevOpsVariable('Agent.OS')
    if (!(operatingSystem === 'Windows_NT')) fs.chmodSync(cachedToolPullPath, '777')
    return cachedToolPullPath
  }

  private async detectIfGitHubIsReachable(): Promise<boolean> {
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

const sortSemanticVersions = (key: string) => (a: any, b: any) => {
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
}

interface GitHubRelease {
  name: string
}
