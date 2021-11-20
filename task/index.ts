import * as path from 'path'
import taskLib = require('azure-pipelines-task-lib/task')
import tr = require('azure-pipelines-task-lib/toolrunner')
import { AzureDevOpsAPI } from './AzureDevOpsAPI'
import { GitleaksTool } from './gitleakstool'
import { getAzureDevOpsInput, getAzureDevOpsVariable } from './helpers'

async function run() {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'), true)
    console.log(taskLib.loc('ThanksToZacharyRice'))
    console.log(taskLib.loc('ThanksToJesseHouwing'))
    console.log()

    const buildReason = getAzureDevOpsVariable('Build.Reason')

    const specifiedVersion = getAzureDevOpsInput('version')
    const customtoollocation = taskLib.getInput('customtoollocation', false)

    const scanfolder = getAzureDevOpsInput('scanfolder')
    const configType = getAzureDevOpsInput('configtype')
    const gitleaksArguments = taskLib.getInput('arguments')

    const predefinedConfigFile = taskLib.getInput('predefinedconfigfile')
    const customConfigFile = taskLib.getInput('configfile')
    const reportformat = getAzureDevOpsInput('reportformat')
    const nogit = taskLib.getBoolInput('nogit')
    const scanonlychanges = taskLib.getBoolInput('scanonlychanges')
    const taskfail = taskLib.getBoolInput('taskfail')

    const gitleaksTool: GitleaksTool = new GitleaksTool()
    const configFileParameter = gitleaksTool.getGitLeaksConfigFileParameter(configType, nogit, predefinedConfigFile, customConfigFile)
    const reportPath = gitleaksTool.getGitleaksReportPath(reportformat)

    const cachedTool = await gitleaksTool.getTool(specifiedVersion, customtoollocation)
    const toolRunner: tr.ToolRunner = new tr.ToolRunner(cachedTool)
    console.log()

    taskLib.debug(taskLib.loc('ScanFolder', scanfolder))
    taskLib.debug(taskLib.loc('ReportPath', reportPath))

    // Replaces Windows \ because of bug in TOML Loader
    toolRunner.arg([`--path=${scanfolder.replace(/\\/g, '/')}`])
    toolRunner.arg([`--report=${reportPath.replace(/\\/g, '/')}`])
    toolRunner.arg([`--format=${reportformat}`])
    if (configFileParameter) toolRunner.arg([`${configFileParameter}`])
    if (nogit) toolRunner.arg(['--no-git'])
    toolRunner.argIf(taskLib.getBoolInput('verbose'), ['--verbose'])
    toolRunner.argIf(taskLib.getBoolInput('redact'), ['--redact'])

    const depth = taskLib.getInput('depth')

    if (buildReason === 'PullRequest') {
      console.log(taskLib.loc('BuildReasonPullRequest'))
      const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
      const commitsFile = await azureDevOpsAPI.getPullRequestCommits()
      toolRunner.arg([`--commits-file=${commitsFile}`])

      if (scanonlychanges || depth) {
        console.warn(taskLib.loc('BuildReasonPullRequestWarning'))
      }
    }
    else {
      if (scanonlychanges) {
        const numberOfCommits = (depth !== undefined) ? Number(depth) : 1000
        const azureDevOpsAPI: AzureDevOpsAPI = new AzureDevOpsAPI()
        const commitsFile = await azureDevOpsAPI.getBuildChangesCommits(numberOfCommits)
        toolRunner.arg([`--commits-file=${commitsFile}`])
      }
      else if (depth) toolRunner.argIf(depth, [`--depth=${depth}`])
    }

    // Process extra arguments
    if (gitleaksArguments) {
      // Split on argument delimiter
      const argumentArray = gitleaksArguments.split('--')
      argumentArray.shift()
      for (const arg of argumentArray) {
        toolRunner.arg([`--${arg.replace(/\\/g, '/').trim()}`])
      }
    }

    console.log()
    console.log(taskLib.loc('GitleaksOutput'))

    // Set options to run the toolRunner
    const options: tr.IExecOptions = {
      failOnStdErr: false,
      ignoreReturnCode: true,
      silent: false
    }

    const result: number = await toolRunner.exec(options)

    if (result === 0) {
      taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('ResultSuccess'))
    }
    else {
      console.warn(taskLib.loc('HelpOnSecretsFound'))
      if (taskLib.exist(reportPath) && taskLib.getBoolInput('uploadresults')) {
        let containerFolder = 'gitleaks'
        if (reportformat === 'sarif') {
          containerFolder = 'CodeAnalysisLogs'
        }
        taskLib.debug(taskLib.loc('UploadResults', containerFolder))
        taskLib.uploadArtifact(containerFolder, reportPath, containerFolder)
      }
      if (taskfail) {
        taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc('ResultError'))
      }
      else {
        taskLib.setResult(taskLib.TaskResult.SucceededWithIssues, taskLib.loc('ResultError'))
      }
    }
  } catch (err) {
    taskLib.setResult(taskLib.TaskResult.Failed, err as string)
  }
}

run()
