import path = require('node:path')

export class ToolCallBuilder {
  private argument = new Array<string>(10)

  constructor () {
    this.argument[0] = '/tool/gitleaks'
    this.argument[1] = 'git'
    this.argument[3] = `${path.join(__dirname, '../')}`
    this.argument[7] = '--report-format=sarif'
    this.argument[8] = `--report-path=${path.join(__dirname, '/gitleaks-report-guid.sarif')}`
    this.argument[12] = "--exit-code=99"
  }

  public withVerbose (): this {
    this.argument[10] = '--verbose'
    return this
  }

  public withCustomTool (): this {
    this.argument[0] = 'exists/gitleaks'
    return this
  }

  public withNoGit (): this {
    this.argument[1] = 'dir'
    return this
  }

  public withDebug (): this {
    this.argument[6] = '--log-level=debug'
    return this
  }

  public withRedact (): this {
    this.argument[5] = '--redact'
    return this
  }

  public withLogOptions (logOptions: string): this {
    this.argument[4] = `--log-opts=${logOptions}`
    return this
  }

  public withConfigPath (configPath: string): this {
    this.argument[2] = `--config=${configPath}`
    return this
  }

  public withReportFormat (reportFormat: string): this {
    const report = `/gitleaks-report-guid.${reportFormat}`
    this.argument[7] = `--report-format=${reportFormat}`
    this.argument[8] = `--report-path=${path.join(__dirname, report)}`
    return this
  }

  public withBaseLinePath (baselineFile: string): this {
    this.argument[11] = `--baseline-path=${baselineFile}`
    return this
  }

  public withWindowsExecutable (): this {
    this.argument[0] = '/tool/gitleaks.exe'
    return this
  }

  public build (): string {
    let callString = ''
    for (const argument of this.argument) {
      if (argument !== undefined) {
        callString = `${callString} ${argument}`
      }
    }
    callString = callString.replace('  ', ' ')
    return callString.trim()
  }
}
