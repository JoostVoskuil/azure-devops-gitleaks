import fs = require('fs')
import Path = require('path')
import * as toolLib from 'azure-pipelines-tool-lib/tool'
import * as restClient from 'typed-rest-client/RestClient'
import taskLib = require('azure-pipelines-task-lib/task')
import { Guid } from 'guid-typescript'

export class GitleaksTool {
  private readonly name: string
  private readonly architecture: string
  private readonly operatingSystem: string
  private readonly providedVersion: string

  constructor(providedVersion: string, operatingSystem: string, architecture: string) {
    this.name = 'gitleaks'
    this.providedVersion = providedVersion
    this.operatingSystem = operatingSystem
    this.architecture = architecture
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  getGitleaksReportPath(tempDirectory: string, reportformat = 'json'): string {
    const reportPath = Path.join(tempDirectory, `${this.name}-report-${Guid.create()}.${reportformat}`)
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
    else if (configType.toLowerCase() === 'customfullpath') {
      configFileParameter = `--config-path=${configFile.replace(/\\/g, '/')}`
    }
    // This behaviour is inconsistent implemented in the task
    // --repo-config-path will dissapear in Gitleaks8
    // Warn users of change of behaviour. Should use the customfullpath option.
    else if (configType.toLowerCase() === 'custom' && nogit) {
      configFileParameter = `--config-path=${configFile.replace(/\\/g, '/')}`
      taskLib.warning(taskLib.loc('WarningBehaviourChangeGitleak8'))
    }
    else if (configType.toLowerCase() === 'custom' && !nogit) {
      configFileParameter = `--repo-config-path=${configFile.replace(/\\/g, '/')}`
      taskLib.warning(taskLib.loc('WarningBehaviourChangeGitleak8'))
    }
    else throw new Error(taskLib.loc('IncorrectConfig'))
    taskLib.debug(taskLib.loc('ConfigFile', configFileParameter))
    return configFileParameter
  }

  async getTool(customToolLocation?: string): Promise<string> {
    if (customToolLocation === undefined) {
      return await this.getToolForAgent();
    }
    else {
      return await this.getToolFromCustomLocation(customToolLocation);
    }
  }

  private async getToolForAgent(): Promise<string> {
    const version = await this.getVersion(this.providedVersion)
    const cachedToolDirectory = toolLib.findLocalTool(this.name, version)
    const toolExecutable = this.getToolFileName()
    let cachedToolExecutable
    if (!cachedToolDirectory) {
      cachedToolExecutable = await this.downloadTool(version, toolExecutable)
    }
    else {
      taskLib.debug(taskLib.loc('AvailableInToolcache', this.name))
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
    const url = `https://api.github.com/repos/${githubAuthor}/${githubRepo}/releases/latest`
    taskLib.debug(taskLib.loc('GettingUrl', url, this.name))
    const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool')
    const gitHubRelease = (await rest.get<GitHubRelease>(url)).result

    if (gitHubRelease != null) {
      taskLib.debug(taskLib.loc('ReleaseInfo', gitHubRelease.name))
      return gitHubRelease.name
    }
    throw Error(taskLib.loc('CannotRetrieveVersion', url))
  }

  private getToolFileName(): string {
    if ((this.operatingSystem === 'Windows_NT') && (this.architecture.toLowerCase() === 'x64')) return 'gitleaks-windows-amd64.exe'
    else if ((this.operatingSystem === 'Windows_NT') && (this.architecture.toLowerCase() === 'x86')) return 'gitleaks-windows-386.exe'
    else if ((this.operatingSystem === 'Darwin') && (this.architecture.toLowerCase() === 'x64')) return 'gitleaks-darwin-amd64'
    else if ((this.operatingSystem === 'Linux') && (this.architecture.toLowerCase() === 'x64')) return 'gitleaks-linux-amd64'
    else if ((this.operatingSystem === 'Linux') && (this.architecture.toLowerCase() === 'arm')) return 'gitleaks-linux-arm'
    else throw new Error(taskLib.loc('OsArchNotSupported', this.operatingSystem, this.architecture, this.name))
  }

  private getDownloadSourceLocation(version: string): string {
    const executable = this.getToolFileName()
    const githubAuthor = 'zricethezav'
    const githubRepo = 'gitleaks'

    const downloadUri = `https://github.com/${githubAuthor}/${githubRepo}/releases/download/v${version}/${executable}`
    taskLib.debug(taskLib.loc('CannotRetrieveVersion', this.name, downloadUri))
    return downloadUri
  }

  private async downloadTool(version: string, toolExecutable: string): Promise<string> {
    const downloadUri = this.getDownloadSourceLocation(version)
    taskLib.debug(taskLib.loc('NoToolcacheDownloading', this.name, this.name, downloadUri))
    const fileGUID = await toolLib.downloadTool(downloadUri)
    const cachedToolDirectory = await toolLib.cacheFile(fileGUID, toolExecutable, this.name, version)
    const cachedToolExecutable = Path.join(cachedToolDirectory, toolExecutable)
    taskLib.debug(`cachedToolExecutable: ${cachedToolExecutable}`)
    // Set permissions
    if (!(this.operatingSystem === 'Windows_NT')) fs.chmodSync(cachedToolExecutable, '777')
    return cachedToolExecutable
  }
}

interface GitHubRelease {
  name: string
}
