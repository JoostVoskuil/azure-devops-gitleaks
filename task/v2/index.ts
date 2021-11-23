import * as path from 'path'
import taskLib = require('azure-pipelines-task-lib/task')
import tr = require('azure-pipelines-task-lib/toolrunner')
import { AzureDevOpsAPI, CommitDiff } from './AzureDevOpsAPI'
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
    const logLevel = getAzureDevOpsInput('loglevel')
    const reportFormat = getAzureDevOpsInput('reportformat')
    const reportPath = getReportPath(reportFormat)

    // Get Tool
    const gitleaksTool = await new GitleaksTool().getGitLeaksTool()
    const toolRunner: tr.ToolRunner = new tr.ToolRunner(gitleaksTool)

    toolRunner.arg['detect']
    toolRunner.argIf((getConfigFilePath() !== undefined), [`--config ${getConfigFilePath()}`])
    toolRunner.arg([`--log-level ${logLevel}`])
    toolRunner.argIf(taskLib.getBoolInput('redact'), ['--redact'])
    toolRunner.arg([`--report-format ${reportFormat}`])
    toolRunner.arg([`--report-path ${replacePathSlashes(reportPath)}`])
    toolRunner.arg([`--source ${replacePathSlashes(scanFolderPath)}`])

    const scanMode = getAzureDevOpsInput('scanmode')
    const logOptions = await determineLogOptions(scanMode);
    toolRunner.argIf(logOptions, [`--log-opts="${logOptions}"`])
    toolRunner.argIf(scanMode === 'nogit', ['--no-git'])
    toolRunner.argIf(taskLib.getBoolInput('verbose'), ['--verbose'])

    console.log()
    console.log(taskLib.loc('GitleaksOutput'))
    const options: tr.IExecOptions = {
      failOnStdErr: false,
      ignoreReturnCode: true,
      silent: false
    }

    const result: number = await toolRunner.exec(options)
    await setTaskOutcomeBasedOnGitLeaksResult(result, reportPath, reportFormat)
  }
  catch (err) {
    const taskfailonexecutionerror = taskLib.getBoolInput('taskfailonexecutionerror')
    if (taskfailonexecutionerror) { taskLib.setResult(taskLib.TaskResult.Failed, err.message) }
    else { taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, err.message) }
  }
}

run()

async function determineLogOptions(scanMode: string): Promise<string | undefined> {

  const logoptions = taskLib.getInput('logoptions')
  const buildReason = getAzureDevOpsVariable('Build.Reason')
  if (logoptions) {
    taskLib.warning(taskLib.loc('LogOptionsFound'))
    return logoptions
  }
  else {
    const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
    if (scanMode === "all") { return undefined }
    else if (scanMode === "prevalidationbuild") {
      if (buildReason === 'PullRequest') {
        console.log(taskLib.loc('BuildReasonPullRequest'))
        const commitDiff = await azureDevOpsAPI.getPullRequestCommits()
        return `--all ${commitDiff.firstCommit}..${commitDiff.lastCommit}`
      }
      else { throw new Error(taskLib.loc('PreValidationBuildInvallid')) }
    }
    else if (scanMode === "changes") {
      const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
      const commitDiff = await azureDevOpsAPI.getBuildChangesCommits(1000)
      return `--all ${commitDiff.firstCommit}..${commitDiff.lastCommit}`
    }
    return undefined
  }
}

async function setTaskOutcomeBasedOnGitLeaksResult(exitCode: number, reportPath: string, reportformat: string): Promise<void> {
  const taskfail = taskLib.getBoolInput('taskfail')
  const uploadResult = taskLib.getBoolInput('uploadresults')

  if (exitCode === 0) { taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('ResultSuccess')) }
  else {
    if (uploadResult) { await uploadResultsToAzureDevOps(reportPath, reportformat) }
    if (taskfail) { taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultError')) }
    else { taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultError')) }
    taskLib.warning(taskLib.loc('HelpOnSecretsFound'))
  }
}

async function uploadResultsToAzureDevOps(reportPath: string, reportFormat: string): Promise<void> {
  let containerFolder
  if (taskLib.exist(reportPath)) {
    if (reportFormat === 'sarif') { containerFolder = 'CodeAnalysisLogs' }
    else { containerFolder = 'gitleaks' }
    taskLib.debug(taskLib.loc('UploadResults', containerFolder))
    taskLib.uploadArtifact(containerFolder, reportPath, containerFolder)
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