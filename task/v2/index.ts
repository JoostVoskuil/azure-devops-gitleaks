import * as path from 'path'
import taskLib = require('azure-pipelines-task-lib/task')
import tr = require('azure-pipelines-task-lib/toolrunner')
import { AzureDevOpsAPI } from './AzureDevOpsAPI'
import { GitleaksTool } from './gitleakstool'
import { getAzureDevOpsInput, getAzureDevOpsPathInput, getAzureDevOpsVariable } from './helpers'
import Path = require('path')

async function run(): Promise<void> {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'), true)
    console.log(taskLib.loc('ThanksToZacharyRice'))
    console.log(taskLib.loc('ThanksToJesseHouwing'))
    console.log()

    // Get inputs on Task Behaviour
    const scanLocation = getAzureDevOpsPathInput('scanlocation')
    const reportFormat = getAzureDevOpsInput('reportformat')
    const reportName = taskLib.getInput('reportname', false)
    const debug = taskLib.getVariable('system.debug')
    const reportPath = getReportPath(reportFormat, reportName)

    // Determine scanmode
    const scanMode = getAzureDevOpsInput('scanmode')
    const logOptions = await determineLogOptions(scanMode)

    // Get Tool
    const gitleaksTool = await new GitleaksTool().getGitLeaksTool()
    const toolRunner: tr.ToolRunner = new tr.ToolRunner(gitleaksTool)

    // Set Gitleaks arguments
    toolRunner.arg(['detect'])
    toolRunner.argIf(getConfigFilePath(), [`--config=${getConfigFilePath()}`])
    toolRunner.arg([`--source=${scanLocation}`])
    toolRunner.argIf(logOptions, [`--log-opts=${logOptions}`])
    toolRunner.argIf(taskLib.getBoolInput('redact'), ['--redact'])
    toolRunner.argIf(debug === 'true', ['--log-level=debug'])
    toolRunner.arg([`--report-format=${reportFormat}`])
    toolRunner.arg([`--report-path=${reportPath}`])
    toolRunner.arg([`--exit-code=99`])
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
  } catch (err) {
    const taskfailonexecutionerror = taskLib.getBoolInput('taskfailonexecutionerror')
    if (taskfailonexecutionerror) { taskLib.setResult(taskLib.TaskResult.Failed, err.message) } else { taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, err.message) }
  }
}

void run()

async function determineLogOptions(scanMode: string): Promise<string | undefined> {
  const buildReason = getAzureDevOpsVariable('Build.Reason')
  let logOptions

  if (scanMode === 'all') {
    return undefined
  } else if (scanMode === 'nogit') {
    return undefined
  } else if (scanMode === 'custom') {
    logOptions = taskLib.getInput('logoptions')
  } else if (scanMode === 'prevalidation' && buildReason === 'PullRequest') {
    logOptions = await getLogOptionsForPreValidationBuild()
  } else if (scanMode === 'prevalidation') {
    throw new Error(taskLib.loc('PreValidationBuildInvallid'))
  } else if (scanMode === 'changes') {
    logOptions = await getLogOptionsForBuildDelta(1000)
  } else if (scanMode === 'smart' && buildReason === 'PullRequest') {
    logOptions = await getLogOptionsForPreValidationBuild()
  } else if (scanMode === 'smart' && buildReason !== 'PullRequest') {
    logOptions = await getLogOptionsForBuildDelta(1000)
  } else throw new Error(taskLib.loc('UnknownScanMode', scanMode))

  if (logOptions === undefined) {
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
  if (commitDiff === undefined || commitDiff.firstCommit === undefined || commitDiff.lastCommit === undefined) return undefined
  return `${commitDiff.firstCommit}^! ${commitDiff.lastCommit}`
}

async function getLogOptionsForBuildDelta(limit: number): Promise<string | undefined> {
  const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
  console.log(taskLib.loc('ChangeScan', limit))
  const commitDiff = await azureDevOpsAPI.getBuildChangesCommits(limit)
  if (commitDiff === undefined || commitDiff.firstCommit === undefined || commitDiff.lastCommit === undefined) return undefined
  return `${commitDiff.firstCommit}^! ${commitDiff.lastCommit}`
}

async function setTaskOutcomeBasedOnGitLeaksResult(exitCode: number, reportPath: string): Promise<void> {
  const taskfail = taskLib.getBoolInput('taskfail')
  const taskfailonexecutionerror = taskLib.getBoolInput('taskfailonexecutionerror')

  const uploadResult = taskLib.getBoolInput('uploadresults')

  if (exitCode === 0) 
  { 
    taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('ResultSuccess')) 
  }
  else if (exitCode === 99) 
  {
    if (uploadResult) { await uploadResultsToAzureDevOps(reportPath) }
    taskLib.error(taskLib.loc('HelpOnSecretsFound'))
    if (taskfail) {
      taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultError'))
    } else {
      taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultError'))
    }
  }
  else {
    if (taskfailonexecutionerror) {
      taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultErrorOnExecution'))
    } else {
      taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultErrorOnExecution'))
    }
  }
}

async function uploadResultsToAzureDevOps(reportPath: string): Promise<void> {
  if (taskLib.exist(reportPath)) {
    taskLib.debug(taskLib.loc('UploadResults', 'CodeAnalysisLogs'))
    taskLib.uploadArtifact('Gitleaks', reportPath, 'CodeAnalysisLogs')
  }
}

function getReportPath(reportFormat: string, reportName?: string): string {
  const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory')
  const jobId = getAzureDevOpsVariable('System.JobId')

  if (reportName) {
    return Path.join(agentTempDirectory, `${reportName}.${reportFormat}`)
  }
  else {
    return Path.join(agentTempDirectory, `gitleaks-report-${jobId}.${reportFormat}`)
  }
}

function getConfigFilePath(): string | undefined {
  const configType = getAzureDevOpsInput('configtype')
  const predefinedConfigFile = taskLib.getInput('predefinedconfigfile')
  const configfile = taskLib.getInput('configfile')

  if (configType.toLowerCase() === 'default') return undefined
  else if (configType.toLowerCase() === 'predefined' && predefinedConfigFile !== undefined) {
    return Path.join(__dirname, 'configs', predefinedConfigFile)
  } else if (configType.toLowerCase() === 'custom' && configfile !== undefined) {
    return configfile
  } else throw new Error(taskLib.loc('IncorrectConfig'))
}
