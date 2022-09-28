import path = require('path')

export class ToolCallBuilder {
  private argument = new Array<string>(10)

  constructor () {
    this.argument[0] = '/tool/gitleaks'
    this.argument[1] = 'detect'
    this.argument[3] = `--source=${path.join(__dirname, '../')}`
    this.argument[7] = '--report-format=sarif'
    this.argument[8] = `--report-path=${path.join(__dirname, '/gitleaks-report-guid.sarif')}`
    this.argument[9] = `--exit-code=99`
  }

  public withVerbose (): ToolCallBuilder {
    this.argument[10] = '--verbose'
    return this
  }

  public withCustomTool (): ToolCallBuilder {
    this.argument[0] = 'exists/gitleaks'
    return this
  }

  public withNoGit (): ToolCallBuilder {
    this.argument[9] = '--no-git'
    return this
  }

  public withDebug (): ToolCallBuilder {
    this.argument[6] = '--log-level=debug'
    return this
  }

  public withRedact (): ToolCallBuilder {
    this.argument[5] = '--redact'
    return this
  }

  public withLogOptions (logOptions: string): ToolCallBuilder {
    this.argument[4] = `--log-opts=${logOptions}`
    return this
  }

  public withConfigPath (configPath: string): ToolCallBuilder {
    this.argument[2] = `--config=${configPath}`
    return this
  }

  public withReportFormat (reportFormat: string): ToolCallBuilder {
    this.argument[7] = `--report-format=${reportFormat}`
    this.argument[8] = `--report-path=${path.join(__dirname, `/gitleaks-report-guid.${reportFormat}`)}`
    return this
  }

  public withWindowsExecutable (): ToolCallBuilder {
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
