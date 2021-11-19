import * as mr from 'azure-pipelines-task-lib/mock-run';
import * as mtr from 'azure-pipelines-task-lib/mock-toolrunner';

export function BuildWithDefaultValues(): void {
	process.env['AGENT_TOOLSDIRECTORY'] = __dirname;
	process.env['AGENT_TEMPDIRECTORY'] = __dirname;
	process.env['AGENT_OS'] = 'Darwin';
	process.env['AGENT_OSARCHITECTURE'] = 'x64';
	process.env['BUILD_REASON'] = 'Manual';
}
/* eslint-disable no-unused-vars */
export function BuildWithDefaultMocks(taskMockRunner: mr.TaskMockRunner): mr.TaskMockRunner {
	// Mock RESTClient for Version information
	taskMockRunner.registerMock('typed-rest-client/RestClient', {
		RestClient: function () {
			return {
				get: async function (url, options) {
					if (url != 'https://api.github.com/repos/zricethezav/gitleaks/releases') {
						throw new Error('Wrong latest releases url');
					}
					return {
						result: [
							{ 'name': 'v10.0.0' },
							{ 'name': 'v9.0.0' },
							{ 'name': 'v8.0.0' },
							{ 'name': 'v7.0.0' },
							{ 'name': 'v6.0.0' }
						]
					};
				}
			}
		}
	});
	taskMockRunner.registerMock('fs', {
		chmodSync: function (filePath, rights) { return },
	});
	taskMockRunner.registerMock('guid-typescript', {
		Guid: {
				create: function () {
					return 'guid';
				}
			}
		}
	);
	return taskMockRunner;
}

export function BuildWithEmptyToolCache(taskMockRunner: mr.TaskMockRunner): mr.TaskMockRunner {
	taskMockRunner.registerMock('azure-pipelines-tool-lib/tool', {
		downloadTool(url, downloadUri, toolExecutable) {
			return '/tool';
		},
		findLocalTool: function (toolName, versionSpec) {
			if (toolName != 'gitleaks') {
				throw new Error('Searching for wrong tool');
			}
			return undefined;
		},
		cleanVersion: function (version) {
			return version;
		},
		cacheFile(fileGUID, toolExecutable, toolName, version) {
			if (toolName != 'gitleaks') {
				throw new Error('Searching for wrong tool');
			}
			return '/tool';
		}
	});
	return taskMockRunner;
}
/* eslint-enable no-unused-vars */

export function BuildWithSucceedingToolExecution(taskMockRunner: mr.TaskMockRunner, executable: string, configFile?: string, customConfigFile?: boolean, reportFormat?: string): mr.TaskMockRunner {
	taskMockRunner.registerMock('azure-pipelines-task-lib/toolrunner', mtr);
	taskMockRunner.setAnswers({
		exec: {
			[createToolCall(executable, configFile, customConfigFile, reportFormat)]: {
				'code': 0,
				'stdout': 'Gitleaks tool console output',
			},
		},
		exist: {
			[reportFile()]: true,
		},
	});
	return taskMockRunner;
}

export function reportFile(reportFormat = 'json'): string {
	return `${__dirname}/gitleaks-report-guid.${reportFormat}`;
}

export function createToolCall(executable: string, configFile?: string, customConfigFile?: boolean, reportFormat = 'json'): string {
	let toolCall;
	if (!configFile) toolCall = `/tool/${executable} --path=${__dirname} --report=${reportFile(reportFormat)} --format=${reportFormat}`;
	if (configFile && customConfigFile) toolCall = `/tool/${executable} --path=${__dirname} --report=${reportFile(reportFormat)} --format=${reportFormat} --repo-config-path=${configFile}`;
	if (configFile && !customConfigFile) toolCall = `/tool/${executable} --path=${__dirname} --report=${reportFile(reportFormat)} --format=${reportFormat} --config-path=${configFile}`;
	return toolCall;
}