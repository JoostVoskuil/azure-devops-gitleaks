import * as mr from 'azure-pipelines-task-lib/mock-run'
import path = require('path')

export class TaskInputBuilder {
  private readonly tmr: mr.TaskMockRunner

  constructor (tmr: mr.TaskMockRunner) {
    this.tmr = tmr
    this.tmr.setInput('scanlocation', path.join(__dirname, '../'))

    this.tmr.setInput('configtype', 'default') // predefined, custom
    this.tmr.setInput('predefinedconfigfile', 'GitleaksUdmCombo.toml') // UDMSecretChecks.toml

    this.tmr.setInput('scanmode', 'all') // all, prevalidation, changes, smart, nogit, custom
    this.tmr.setInput('logoptions', '')

    this.tmr.setInput('redact', 'false')
    this.tmr.setInput('taskfail', 'true')
    this.tmr.setInput('uploadresults', 'true')
    this.tmr.setInput('reportfolder', __dirname)
    this.tmr.setInput('reportartifactname', 'CodeAnalysisLogs')


    this.tmr.setInput('reportformat', 'sarif')// csv, json
    this.tmr.setInput('verbose', 'false')

    this.tmr.setInput('taskfailonexecutionerror', 'true')
    this.tmr.setInput('version', 'latest')
  }

  public build (): mr.TaskMockRunner {
    return this.tmr
  }

  public withPredefinedConfigFile (file: string): this {
    this.tmr.setInput('configtype', 'predefined')
    this.tmr.setInput('predefinedconfigfile', file)
    this.tmr.setInput('configfile', '')
    return this
  }

  public withCustomConfigFile (file?: string): this {
    this.tmr.setInput('configtype', 'custom')
    this.tmr.setInput('predefinedconfigfile', '')
    if (file !== undefined) this.tmr.setInput('configfile', file)
    return this
  }

  public withBaseLine (baselinePath: string): this {
    this.tmr.setInput('baseLinePath', baselinePath)
    return this
  }

  public withScanMode (scanmode: string): this {
    this.tmr.setInput('scanmode', scanmode)
    return this
  }

  public withLogOptions (logoptions: string): this {
    this.tmr.setInput('scanmode', 'custom')
    this.tmr.setInput('logoptions', logoptions)
    return this
  }

  public withRedact (redact: boolean): this {
    this.tmr.setInput('redact', String(redact))
    return this
  }

  public withTaskFail (fail: boolean): this {
    this.tmr.setInput('taskfail', String(fail))
    return this
  }

  public withUploadResults (uploadResults: boolean): this {
    this.tmr.setInput('uploadresults', String(uploadResults))
    return this
  }

  public withReportFormat (reportFormat: string): this {
    this.tmr.setInput('reportformat', reportFormat)
    return this
  }

  public withVerbose (verbose: boolean): this {
    this.tmr.setInput('verbose', String(verbose))
    return this
  }

  public withTaskFailOnExecutionError (error: boolean): this {
    this.tmr.setInput('taskfailonexecutionerror', String(error))
    return this
  }

  public withVersion (version: string): this {
    this.tmr.setInput('version', version)
    return this
  }

  public withCustomToolLocationInput (toolLocation: string): this {
    this.tmr.setInput('customtoollocation', toolLocation)
    return this
  }
  public withCustomToolLocationVariable (toolLocation: string): this {
    process.env['AGENT_TOOLSGITLEAKSDIRECTORY'] = toolLocation
    return this
  }
}
