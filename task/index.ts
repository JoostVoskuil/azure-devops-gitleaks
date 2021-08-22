import taskLib = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import { AzureDevOpsAPI } from './AzureDevOpsAPI';
import { GitleaksTool } from './gitleakstool';
import { getAzureDevOpsInput, getAzureDevOpsVariable } from './helpers';

async function run() {
	try {
		console.log(`Thanks to Zachary Rice (https://github.com/zricethezav) for creating and maintaining gitleaks.`);
		console.log(`Thanks to Jesse Houwing (https://github.com/jessehouwing) for providing a gitleaks config that has most of Microsoft's deprecated credscan rules ported to it.`);
		console.log();

		const operatingSystem = getAzureDevOpsVariable('Agent.OS');
		const architecture = getAzureDevOpsVariable('Agent.OSArchitecture');
		const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory');

		const specifiedVersion = taskLib.getInput('version') || 'latest';
		const scanfolder = getAzureDevOpsInput('scanfolder');
		const configType = taskLib.getInput('configtype') || 'default';

		const predefinedConfigFile = taskLib.getInput('predefinedconfigfile');
		const customConfigFile = taskLib.getInput('configfile');
		const nogit = taskLib.getBoolInput('nogit');
		const scanonlychanges = taskLib.getBoolInput('scanonlychanges');

		const gitleaksTool: GitleaksTool = new GitleaksTool('gitleaks', specifiedVersion, operatingSystem, architecture);
		const configFileParameter = gitleaksTool.getGitLeaksConfigFileParameter(configType, nogit, predefinedConfigFile, customConfigFile,);
		const reportPath = gitleaksTool.getGitleaksReportPath(agentTempDirectory);

		const cachedTool = await gitleaksTool.getTool();
		const toolRunner: tr.ToolRunner = new tr.ToolRunner(cachedTool);

		console.debug(`Scan Folder is set to ${scanfolder}`);
		console.debug(`Report path is set to ${reportPath}`);

		//Replaces Windows \ because of bug in TOML Loader
		toolRunner.arg([`--path=${scanfolder.replace(/\\/g, '/')}`]);
		toolRunner.arg([`--report=${reportPath.replace(/\\/g, '/')}`]);
		if (configFileParameter) toolRunner.arg([`${configFileParameter}`]);
		if (nogit) toolRunner.arg([`--no-git`]);
		if (taskLib.getBoolInput('verbose')) toolRunner.arg([`--verbose`]);
		if (scanonlychanges) {
			const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI();
			const commits = await azureDevOpsAPI.getBuildChanges();
			toolRunner.arg([`--commits=${commits}`]);
		}

		// Set options to run the toolRunner
		const options: tr.IExecOptions = {
			failOnStdErr: false,
			ignoreReturnCode: true,
			silent: false,
			outStream: process.stdout,
			errStream: process.stderr
		};

		const result: number = await toolRunner.exec(options);

		if (result === 0) {
			taskLib.setResult(taskLib.TaskResult.Succeeded, '');
		} else {
			if (taskLib.exist(reportPath) && taskLib.getBoolInput('uploadresults')) {
				taskLib.uploadArtifact('gitleaks', reportPath, 'gitleaks');
			}
			taskLib.setResult(taskLib.TaskResult.Failed, 'Leaks or error encountered. See log and report for details.');
		}
	}
	catch (err) {
		taskLib.setResult(taskLib.TaskResult.Failed, err as string);
	}
}

run();