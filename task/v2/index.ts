import * as path from 'path'
import taskLib = require('azure-pipelines-task-lib/task')
import tr = require('azure-pipelines-task-lib/toolrunner')
import { AzureDevOpsAPI } from './AzureDevOpsAPI'
import { GitleaksTool } from './gitleakstool'
import { getAzureDevOpsInput, getAzureDevOpsVariable, replacePathSlashes } from './helpers'
import Path = require('path')
import { Guid } from 'guid-typescript'

async function run() {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'), true)
    console.log(taskLib.loc('ThanksToZacharyRice'))
    console.log(taskLib.loc('ThanksToJesseHouwing'))
    console.log()

    //Get inputs on Task Behaviour
    const scanFolderPath = getAzureDevOpsInput('scanfolder')
    const reportFormat = getAzureDevOpsInput('reportformat')
    const debug = taskLib.getVariable('system.debug')
    const reportPath = getReportPath(reportFormat)

    // Determine scanmode
    const scanMode = getAzureDevOpsInput('scanmode')
    const logOptions = await determineLogOptions(scanMode);

    // Get Tool
    const gitleaksTool = await new GitleaksTool().getGitLeaksTool()
    const toolRunner: tr.ToolRunner = new tr.ToolRunner(gitleaksTool)

    // Set Gitleaks arguments
    toolRunner.arg([`detect`])
    toolRunner.argIf(getConfigFilePath(), [`--config=${getConfigFilePath()}`])
    toolRunner.arg([`--source=${replacePathSlashes(scanFolderPath)}`])
    toolRunner.argIf(logOptions, [`--log-opts=${logOptions}`])
    toolRunner.argIf(taskLib.getBoolInput('redact'), ['--redact'])
    toolRunner.argIf(debug === "true", ['--log-level=debug'])
    toolRunner.arg([`--report-format=${reportFormat}`])
    toolRunner.arg([`--report-path=${replacePathSlashes(reportPath)}`])
    toolRunner.argIf(scanMode === 'nogit', ['--no-git'])
    toolRunner.argIf(taskLib.getBoolInput('verbose'), ['--verbose'])

    // Set Tool options
    const options: tr.IExecOptions = {
      failOnStdErr: false,
      ignoreReturnCode: true,
      silent: false
    }

    // Execute and determine outcome
    const result: number = await toolRunner.exec(options)
    await setTaskOutcomeBasedOnGitLeaksResult(result, reportPath)
  }
  // Error handling on task downloading and execution
  catch (err) {
    const taskfailonexecutionerror = taskLib.getBoolInput('taskfailonexecutionerror')
    if (taskfailonexecutionerror) { taskLib.setResult(taskLib.TaskResult.Failed, err.message) }
    else { taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, err.message) }
  }
}

run()

async function determineLogOptions(scanMode: string): Promise<string | undefined> {
  const buildReason = getAzureDevOpsVariable('Build.Reason')
  let logOptions

  if (scanMode === "all") { return undefined }
  else if (scanMode === "nogit") { return undefined }
  else if (scanMode === "custom") { logOptions = taskLib.getInput('logoptions') }
  else if (scanMode === "prevalidationbuild" && buildReason === 'PullRequest') { logOptions = await getLogOptionsForPreValidationBuild() }
  else if (scanMode === "prevalidationbuild") { throw new Error(taskLib.loc('PreValidationBuildInvallid')) }
  else if (scanMode === "changes") { logOptions = await getLogOptionsForBuildDelta(1000) }
  else if (scanMode === "smart" && buildReason === 'PullRequest') { logOptions = await getLogOptionsForPreValidationBuild() }
  else if (scanMode === "smart" && buildReason !== 'PullRequest') { logOptions = await getLogOptionsForBuildDelta(1000) }
  else throw new Error(taskLib.loc('UnknownScanMode', scanMode))

  if (!logOptions) {
    console.log(taskLib.loc('NoCommitsToScan'))
    taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('NoCommitsToScan'), true)
    return process.exit(0)
  }
  return logOptions
}

async function getLogOptionsForPreValidationBuild(): Promise<string | undefined> {
  const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
  console.log(taskLib.loc('PreValidationScan'))
  const commitDiff = await azureDevOpsAPI.getPullRequestCommits()
  if (!commitDiff) return undefined
  return `${commitDiff.firstCommit}^..${commitDiff.lastCommit}`
}

async function getLogOptionsForBuildDelta(limit: number): Promise<string | undefined> {
  const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
  console.log(taskLib.loc('ChangeScan', limit))
  const commitDiff = await azureDevOpsAPI.getBuildChangesCommits(limit)
  if (!commitDiff) return undefined
  return `${commitDiff.firstCommit}^..${commitDiff.lastCommit}`
}

async function setTaskOutcomeBasedOnGitLeaksResult(exitCode: number, reportPath: string): Promise<void> {
  const taskfail = taskLib.getBoolInput('taskfail')
  const uploadResult = taskLib.getBoolInput('uploadresults')

  if (exitCode === 0) { taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('ResultSuccess')) }
  else {
    if (uploadResult) { await uploadResultsToAzureDevOps(reportPath) }
    taskLib.error(taskLib.loc('HelpOnSecretsFound'))
    if (taskfail) {
      taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultError'))
    }
    else {
      taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultError'))
    }
  }
}

async function uploadResultsToAzureDevOps(reportPath: string): Promise<void> {
  if (taskLib.exist(reportPath)) {
    taskLib.debug(taskLib.loc('UploadResults', 'CodeAnalysisLogs'))
    taskLib.uploadArtifact('Gitleaks', reportPath, 'CodeAnalysisLogs')
  }
}

function getReportPath(reportFormat: string): string {
  const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory')
  const reportPath = Path.join(agentTempDirectory, `gitleaks-report-${Guid.create()}.${reportFormat}`)
  return reportPath
}

function getConfigFilePath(): string | undefined {
  const configType = getAzureDevOpsInput('configtype')
  const predefinedConfigFile = taskLib.getInput('predefinedconfigfile')
  const configfile = taskLib.getInput('configfile')

  if (configType.toLowerCase() === 'default') return undefined
  else if (configType.toLowerCase() === 'predefined' && predefinedConfigFile !== undefined) {
    return replacePathSlashes(Path.join(__dirname, 'configs', predefinedConfigFile))
  }
  else if (configType.toLowerCase() === 'custom' && configfile !== undefined) {
    return replacePathSlashes(configfile)
  }
  else throw new Error(taskLib.loc('IncorrectConfig'))
}