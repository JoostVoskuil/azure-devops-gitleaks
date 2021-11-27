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
    if (customtoollocation === undefined) { return await this.getToolFromAgent(specifiedVersion) } else { return await this.getToolFromCustomLocation(customtoollocation) }
  }

  private async getToolFromCustomLocation(customToolLocation: string): Promise<string> {
    const toolExecutable = this.getGitleaksExecutableFileName()
    const toolLocation = Path.join(customToolLocation, toolExecutable)
    if (taskLib.exist(toolLocation)) return toolLocation
    throw new Error(taskLib.loc('GitLeaksNotFound', toolLocation))
  }

  private async findToolVersionOnAgent(version: string): Promise<string | undefined> {
    const cachedVersionsbyAgent = toolLib.findLocalToolVersions('gitleaks')
    if (cachedVersionsbyAgent === undefined || cachedVersionsbyAgent.length === 0) return undefined
    taskLib.debug(taskLib.loc('CachedVersions', cachedVersionsbyAgent))
    if (version.toLowerCase() === 'latest') {
      return (cachedVersionsbyAgent.sort((one, two) => (one > two ? -1 : 1)))[0]
    } else {
      return cachedVersionsbyAgent.find(x => x === toolLib.cleanVersion(version))
    }
  }

  private async getToolFromOfflineAgent(version: string): Promise<string> {
    const toolExecutable = this.getGitleaksExecutableFileName()
    console.log(taskLib.loc('OfflineAgent'))
    const latestVersionAvailableOnAgent = await this.findToolVersionOnAgent(version)
    if (latestVersionAvailableOnAgent === undefined) throw new Error(taskLib.loc('OfflineAgentToolNotAvailable'))
    const cachedToolDirectory = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnAgent)
    return Path.join(cachedToolDirectory, toolExecutable)
  }

  private async getToolFromOnlineAgentBasedOnLatest(version): Promise<string> {
    const latestVersionAvailableOnGitHub = await this.getLatestToolVersionFromGitHub()
    const toolExecutable = this.getGitleaksExecutableFileName()
    const versionOnAgent = await this.findToolVersionOnAgent(version)
    if (versionOnAgent !== undefined && versionOnAgent === latestVersionAvailableOnGitHub) {
      console.log(taskLib.loc('OnlineAgentHasLatestVersion', latestVersionAvailableOnGitHub))
      const cachedToolDirectory = toolLib.findLocalTool('gitleaks', latestVersionAvailableOnGitHub)
      return Path.join(cachedToolDirectory, toolExecutable)
    } else {
      console.log(taskLib.loc('OnlineAgentHasNotTheLatestVersion', latestVersionAvailableOnGitHub))
      return await this.downloadGitLeaks(latestVersionAvailableOnGitHub)
    }
  }

  private async getToolFromOnlineAgentBasedOnVersion(version): Promise<string> {
    const toolExecutable = this.getGitleaksExecutableFileName()
    const versionOnAgent = await this.findToolVersionOnAgent(version)
    if (versionOnAgent !== undefined && versionOnAgent === toolLib.cleanVersion(version)) {
      console.log(taskLib.loc('AvailableInToolcache', version))
      const cachedToolDirectory = toolLib.findLocalTool('gitleaks', toolLib.cleanVersion(version))
      return Path.join(cachedToolDirectory, toolExecutable)
    } else {
      console.log(taskLib.loc('NoToolcacheDownloading', version, version))
      return await this.downloadGitLeaks(toolLib.cleanVersion(version))
    }
  }

  private async getToolFromAgent(specifiedVersion: string): Promise<string> {
    const isGitHubAvailable = await this.detectIfGitHubIsReachable()

    // Detect minimal version of Gitleaks supported is version 8
    if (specifiedVersion.toLowerCase() !== 'latest') {
      const version = toolLib.cleanVersion(specifiedVersion)
      const semver = version.split('.')
      if (Number(semver[0]) < 8) throw Error(taskLib.loc('MinimalAllowdVersion', version))
    }

    if (!isGitHubAvailable) {
      return await this.getToolFromOfflineAgent(specifiedVersion)
    } else if (specifiedVersion.toLowerCase() === 'latest') {
      return await this.getToolFromOnlineAgentBasedOnLatest(specifiedVersion.toLowerCase())
    } else {
      return await this.getToolFromOnlineAgentBasedOnVersion(specifiedVersion)
    }
  }

  private getDownloadFileName(version: string): string {
    const operatingSystem = getAzureDevOpsVariable('Agent.OS')
    const architecture = getAzureDevOpsVariable('Agent.OSArchitecture')

    if ((operatingSystem === 'Windows_NT') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_windows_x64.zip`
    else if ((operatingSystem === 'Darwin') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_darwin_x64.tar.gz`
    else if ((operatingSystem === 'Linux') && (architecture.toLowerCase() === 'x64')) return `gitleaks_${version}_linux_x64.tar.gz`
    else throw new Error(taskLib.loc('OsArchNotSupported', operatingSystem, architecture, 'gitleaks'))
  }

  private async getLatestToolVersionFromGitHub(): Promise<string> {
    // Get information from github
    const url = 'https://api.github.com/repos/zricethezav/gitleaks/releases'
    const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool', undefined, undefined, getRequestOptions())
    const gitHubReleases = (await rest.get<GitHubRelease[]>(url)).result
    if (gitHubReleases === null) throw new Error(taskLib.loc('CannotRetrieveVersion', url))

    // sort releases and get top release as latest
    gitHubReleases.sort((a, b) => (a.name > b.name) ? -1 : 1)
    const version = toolLib.cleanVersion(gitHubReleases[0].name.substr(1, gitHubReleases[0].name.length))
    taskLib.debug(taskLib.loc('ReleaseInfo', version))
    return version
  }

  private getGitleaksExecutableFileName(): string {
    if (getAzureDevOpsVariable('Agent.OS') === 'Windows_NT') return 'gitleaks.exe'
    else return 'gitleaks'
  }

  private async downloadGitLeaks(version: string): Promise<string> {
    // Download, extract and cache tool
    const url = `https://github.com/zricethezav/gitleaks/releases/download/v${version}/${this.getDownloadFileName(version)}`
    const temp = await toolLib.downloadTool(url)
    taskLib.debug(taskLib.loc('Downloading', url))
    const extractedToolLocation = Path.join(await toolLib.extractTar(temp), this.getGitleaksExecutableFileName())
    const cachedToolDirectory = await toolLib.cacheFile(extractedToolLocation, this.getGitleaksExecutableFileName(), 'gitleaks', version)
    const cachedToolFullPath = Path.join(cachedToolDirectory, this.getGitleaksExecutableFileName())
    taskLib.debug(taskLib.loc('cachedToolExecutable', cachedToolFullPath))

    // Set permissions
    if (!(getAzureDevOpsVariable('Agent.OS') === 'Windows_NT')) fs.chmodSync(cachedToolFullPath, '777')
    return cachedToolFullPath
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

interface GitHubRelease {
  name: string
}
