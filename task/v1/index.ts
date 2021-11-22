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
    const gitleaksArguments = taskLib.getInput('arguments')
    const reportFormat = getAzureDevOpsInput('reportformat')
    const depth = Number(taskLib.getInput('depth'))

    const reportPath = getReportPath(reportFormat)

    // Get Tool
    const gitleaksTool = await new GitleaksTool().getGitLeaksTool()
    const toolRunner: tr.ToolRunner = new tr.ToolRunner(gitleaksTool)
    
    // Get Commits
    console.log()
    const commitsFile = await getCommitsFileFromAzureDevOpsAPI();

    toolRunner.argIf(scanFolderPath, [`--path=${replacePathSlashes(scanFolderPath)}`])
    toolRunner.argIf(reportPath, [`--report=${replacePathSlashes(reportPath)}`])
    toolRunner.argIf(reportPath, [`--format=${reportFormat}`])
    toolRunner.argIf((getConfigPathType() !== undefined), [`${getConfigPathType()}=${getConfigFilePath()}`])
    toolRunner.argIf(taskLib.getBoolInput('nogit'), ['--no-git'])
    toolRunner.argIf(taskLib.getBoolInput('verbose'), ['--verbose'])
    toolRunner.argIf(taskLib.getBoolInput('redact'), ['--redact'])
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    toolRunner.argIf(commitsFile, [`--commits-file=${replacePathSlashes(commitsFile!)}`])
    toolRunner.argIf(depth, [`--depth=${depth}`])

    // Process extra arguments
    if (gitleaksArguments) {
      // Split on argument delimiter
      const argumentArray = gitleaksArguments.split('--')
      argumentArray.shift()
      for (const arg of argumentArray) {
        toolRunner.arg([`--${replacePathSlashes(arg).trim()}`])
      }
    }

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

async function setTaskOutcomeBasedOnGitLeaksResult(exitCode: number, reportPath: string, reportformat: string): Promise<void> {
  const taskfail = taskLib.getBoolInput('taskfail')
  const uploadResult = taskLib.getBoolInput('uploadresults')

  if (exitCode === 0) { taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('ResultSuccess')) }
  else {
    if (uploadResult) { await uploadResultsToAzureDevOps(reportPath, reportformat) }
    if (taskfail) { taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultError')) }
    else { taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultError')) }
    console.warn(taskLib.loc('HelpOnSecretsFound'))
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

async function getCommitsFileFromAzureDevOpsAPI(): Promise<string | undefined> {
  const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
  const buildReason = getAzureDevOpsVariable('Build.Reason')
  const scanonlychanges = taskLib.getBoolInput('scanonlychanges')
  const prevalidationbuild = taskLib.getBoolInput('prevalidationbuild')

  const depth = Number(taskLib.getInput('depth'))
  if (prevalidationbuild && buildReason === 'PullRequest') {
    console.log(taskLib.loc('BuildReasonPullRequest'))
    const commitsFile = await azureDevOpsAPI.getPullRequestCommits()
    if (scanonlychanges || depth) { console.warn(taskLib.loc('BuildReasonPullRequestWarning')) }
    return commitsFile
  }
  else if (scanonlychanges) {
    const numberOfCommits = (depth !== undefined) ? Number(depth) : 1000
    const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
    const commitsFile = await azureDevOpsAPI.getBuildChangesCommits(numberOfCommits)
    return commitsFile
  }
  return undefined
}

function getReportPath(reportFormat: string): string {
  const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory')
  const reportPath = Path.join(agentTempDirectory, `gitleaks-report-${Guid.create()}.${reportFormat}`)
  return reportPath
}

function getConfigPathType(): string | undefined {
  const nogit = taskLib.getBoolInput('nogit')
  const configType = getAzureDevOpsInput('configtype')

  if (configType.toLowerCase() === 'default') return undefined
  if (configType.toLowerCase() === 'custom' && !nogit) {
    return `--repo-config-path`
  }
  else return `--config-path`
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