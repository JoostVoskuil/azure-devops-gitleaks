import fs = require('fs')
import Path = require('path')
import * as toolLib from 'azure-pipelines-tool-lib/tool'
import * as restClient from 'typed-rest-client/RestClient'
import taskLib = require('azure-pipelines-task-lib/task')
import { Guid } from 'guid-typescript'
import { getAzureDevOpsVariable } from './helpers'

export class GitleaksTool {
  constructor() {
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  getGitleaksReportPath(reportFormat: string): string {
    const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory')
    const reportPath = Path.join(agentTempDirectory, `gitleaks-report-${Guid.create()}.${reportFormat}`)
    return reportPath
  }

  getGitLeaksConfigFileParameter(configType: string, nogit: boolean, predefinedConfigFile?: string, configFile?: string): string | undefined {
    let configFileParameter: string
    if (configType.toLowerCase() === 'default') return undefined

    if (configType.toLowerCase() === 'predefined' && predefinedConfigFile !== undefined) {
      const fullPath = Path.join(__dirname, 'configs', predefinedConfigFile)
      configFileParameter = `--config-path=${fullPath.replace(/\\/g, '/')}`
      taskLib.debug(taskLib.loc('ConfigFile', configFileParameter))
      return configFileParameter
    }

    if (configFile === undefined) throw new Error(taskLib.loc('IncorrectConfig'))
    else if (configType.toLowerCase() === 'custom' && nogit) {
      configFileParameter = `--config-path=${configFile.replace(/\\/g, '/')}`
    }
    else if (configType.toLowerCase() === 'custom' && !nogit) {
      configFileParameter = `--repo-config-path=${configFile.replace(/\\/g, '/')}`
    }
    else throw new Error(taskLib.loc('IncorrectConfig'))
    taskLib.debug(taskLib.loc('ConfigFile', configFileParameter))
    return configFileParameter
  }

  async getTool(providedVersion: string, customToolLocation?: string): Promise<string> {
    if (customToolLocation === undefined) {
      return await this.getToolForAgent(providedVersion);
    }
    else {
      return await this.getToolFromCustomLocation(customToolLocation);
    }
  }

  private async getToolForAgent(providedVersion: string): Promise<string> {
    const version = await this.getVersion(providedVersion)
    const cachedToolDirectory = toolLib.findLocalTool('gitleaks', version)
    const toolExecutable = this.getToolFileName()
    let cachedToolExecutable
    if (!cachedToolDirectory) {
      cachedToolExecutable = await this.downloadTool(version, toolExecutable)
    }
    else {
      taskLib.debug(taskLib.loc('AvailableInToolcache', 'gitleaks'))
      cachedToolExecutable = Path.join(cachedToolDirectory, toolExecutable)
    }
    taskLib.debug(taskLib.loc('CachedTool', cachedToolExecutable))
    return cachedToolExecutable
  }

  private async getToolFromCustomLocation(customToolLocation: string): Promise<string> {
    const toolExecutable = this.getToolFileName()
    const toolLocation = Path.join(customToolLocation, toolExecutable)
    if (taskLib.exist(toolLocation)) return toolLocation
    throw new Error(taskLib.loc('GitLeaksNotFound', toolLocation))
  }

  private async getVersion(inputVersion: string): Promise<string> {
    if (inputVersion.toLowerCase() !== 'latest') {
      return this.cleanVersion(inputVersion)
    } else {
      const latestVersion = await this.getLatestVersionFromGitHub()
      return this.cleanVersion(latestVersion)
    }
  }

  private cleanVersion(version): string {
    version = toolLib.cleanVersion(version)
    if (version) return version
    throw Error(taskLib.loc('CannotParseVersion', version))
  }

  private async getLatestVersionFromGitHub(): Promise<string> {
    const githubAuthor = 'zricethezav'
    const githubRepo = 'gitleaks'
    const latestAllowedMajorRelease = 'v7'
    const url = `https://api.github.com/repos/${githubAuthor}/${githubRepo}/releases`
    taskLib.debug(taskLib.loc('GettingUrl', url, 'gitleaks'))

    const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool')
    const gitHubReleases = (await rest.get<GitHubRelease[]>(url)).result
    
    if (gitHubReleases === null) throw Error(taskLib.loc('CannotRetrieveVersion', url))
    // filter allowed latest major release
    const allowedReleases = gitHubReleases.filter(a=>a.name.startsWith(latestAllowedMajorRelease))
    if (allowedReleases === null) throw Error(taskLib.loc('CannotRetrieveVersion', url))
    
    // sort releases
    allowedReleases.sort((a, b) => (a.name > b.name) ? -1 : 1)
    taskLib.debug(taskLib.loc('ReleaseInfo', allowedReleases[0].name))
    return allowedReleases[0].name.substr(1,allowedReleases[0].name.length)
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

  private getDownloadSourceLocation(version: string): string {
    const executable = this.getToolFileName()
    const githubAuthor = 'zricethezav'
    const githubRepo = 'gitleaks'

    const downloadUri = `https://github.com/${githubAuthor}/${githubRepo}/releases/download/v${version}/${executable}`
    taskLib.debug(taskLib.loc('CannotRetrieveVersion', 'gitleaks', downloadUri))
    return downloadUri
  }

  private async downloadTool(version: string, toolExecutable: string): Promise<string> {
    const operatingSystem = getAzureDevOpsVariable('Agent.OS')
    const downloadUri = this.getDownloadSourceLocation(version)
    taskLib.debug(taskLib.loc('NoToolcacheDownloading', 'gitleaks', 'gitleaks', downloadUri))
    const fileGUID = await toolLib.downloadTool(downloadUri)
    const cachedToolDirectory = await toolLib.cacheFile(fileGUID, toolExecutable, 'gitleaks', version)
    const cachedToolExecutable = Path.join(cachedToolDirectory, toolExecutable)
    taskLib.debug(`cachedToolExecutable: ${cachedToolExecutable}`)
    // Set permissions
    if (!(operatingSystem === 'Windows_NT')) fs.chmodSync(cachedToolExecutable, '777')
    return cachedToolExecutable
  }
}

interface GitHubRelease {
  name: string
}
