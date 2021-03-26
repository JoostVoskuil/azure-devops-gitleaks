import fs = require('fs');
import Path = require('path');
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as restClient from 'typed-rest-client/RestClient';
import taskLib = require('azure-pipelines-task-lib/task');
import { Guid } from "guid-typescript";

export class GitleaksTool {
	private name: string;
	private architecture: string;
	private operatingSystem: string;
	private providedVersion: string;

	constructor(name: string, providedVersion: string, operatingSystem: string, architecture: string) {
		this.name = name;
		this.providedVersion = providedVersion;
		this.operatingSystem = operatingSystem;
		this.architecture = architecture;
	}

	getGitleaksReportPath(tempDirectory: string): string {
		const reportPath = Path.join(tempDirectory, `${this.name}-report-${Guid.create()}.json`);
		return reportPath;
	}

	getGitLeaksConfigFileParameter(configType: string, predefinedConfigFile?: string, configFile?: string): string | undefined {
		let configFileParameter: string;
		if (configType.toLowerCase() === 'default') return undefined;
		else if (configType.toLowerCase() === 'predefined' && predefinedConfigFile !== undefined) {
			const fullPath = Path.join(__dirname, 'configs', predefinedConfigFile);
			configFileParameter = `--config-path=${fullPath.replace(/\\/g, '/')}`;
		}
		else if (configType.toLowerCase() === 'custom' && configFile !== undefined) {
			configFileParameter = `--repo-config-path=${configFile.replace(/\\/g, '/')}`;
		}
		else throw new Error(`Incorrect configuration set.`);
		taskLib.debug(`Config file parameter is set to ${configFileParameter} .`);
		return configFileParameter;
	}

	async getTool(): Promise<string> {
		const version = await this.getVersion(this.providedVersion);
		const toolExecutable = this.getToolFileName();
		const cachedToolDirectory = toolLib.findLocalTool(this.name, version);
		let cachedToolExecutable;
		if (!cachedToolDirectory) {
			cachedToolExecutable = await this.downloadTool(version, toolExecutable);
		}
		else {
			taskLib.debug(`${this.name} is already available in toolcache.`);
			cachedToolExecutable = Path.join(cachedToolDirectory, toolExecutable);
		}
		taskLib.debug(`Cached tool is ${cachedToolExecutable}`);
		return cachedToolExecutable;
	}

	private async getVersion(inputVersion: string): Promise<string> {
		if (inputVersion.toLowerCase() !== 'latest') {
			return this.cleanVersion(inputVersion);
		}
		else {
			const latestVersion = await this.getLatestVersionFromGitHub();
			return this.cleanVersion(latestVersion);
		}
	}

	private cleanVersion(version): string {
		version = toolLib.cleanVersion(version);
		if (version) return version;
		throw Error(`Cannot parse version ${version}`);
	}

	private async getLatestVersionFromGitHub(): Promise<string> {
		const githubAuthor = 'zricethezav';
		const githubRepo = 'gitleaks';
		const url = `https://api.github.com/repos/${githubAuthor}/${githubRepo}/releases/latest`;
		taskLib.debug(`Getting ${url} to find latest version of ${this.name}`);
		const rest: restClient.RestClient = new restClient.RestClient('vsts-node-tool');
		const gitHubRelease = (await rest.get<GitHubRelease>(url)).result;

		if (gitHubRelease) {
			taskLib.debug(`Downloaded release info: ${gitHubRelease.name}`);
			return gitHubRelease.name;
		}
		throw Error(`Cannot retreive version from ${url}`)
	}

	private getToolFileName(): string {
		if ((this.operatingSystem === 'Windows_NT') && (this.architecture.toLowerCase() === 'x64')) return "gitleaks-windows-amd64.exe";
		else if ((this.operatingSystem === 'Windows_NT') && (this.architecture.toLowerCase() === 'x86')) return "gitleaks-windows-386.exe";
		else if ((this.operatingSystem === 'Darwin') && (this.architecture.toLowerCase() === 'x64')) return "gitleaks-darwin-amd64";
		else if ((this.operatingSystem === 'Linux') && (this.architecture.toLowerCase() === 'x64')) return "gitleaks-linux-amd64";
		else if ((this.operatingSystem === 'Linux') && (this.architecture.toLowerCase() === 'arm')) return "gitleaks-linux-arm";
		else throw new Error(`OS '${this.operatingSystem}' and archtecture '${this.architecture}' is not supported by ${this.name}.`);
	}

	private getDownloadSourceLocation(version: string): string {
		const executable = this.getToolFileName();
		const githubAuthor = 'zricethezav';
		const githubRepo = 'gitleaks';

		const downloadUri = `https://github.com/${githubAuthor}/${githubRepo}/releases/download/v${version}/${executable}`;
		taskLib.debug(`${this.name} download uri is ${downloadUri}`);
		return downloadUri;
	}

	private async downloadTool(version: string, toolExecutable: string): Promise<string> {
		const downloadUri = this.getDownloadSourceLocation(version);
		taskLib.debug(`${this.name} is not available in toolcache. Downloading ${this.name} from ${downloadUri}`);
		const fileGUID = await toolLib.downloadTool(downloadUri);
		const cachedToolDirectory = await toolLib.cacheFile(fileGUID, toolExecutable, this.name, version);
		const cachedToolExecutable = Path.join(cachedToolDirectory, toolExecutable);
		taskLib.debug(`cachedToolExecutable: ${cachedToolExecutable}`);
		//Set permissions
		if (!(this.operatingSystem === 'Windows_NT')) fs.chmodSync(cachedToolExecutable, '777');
		return cachedToolExecutable;
	}
}

interface GitHubRelease {
	name: string,
}