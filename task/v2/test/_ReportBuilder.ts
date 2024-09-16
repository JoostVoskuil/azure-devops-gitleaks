import path = require('node:path')

export class ReportBuilder {
  private reportFile: string

  constructor () {
    this.reportFile = path.join(__dirname, '/gitleaks-report-guid.sarif')
  }

  public withReportName (reportType: string, reportName: string): this {
    this.reportFile = path.join(__dirname, `/${reportName}.${reportType}`)
    return this
  }

  public withReportFormat (reportType: string): ReportBuilder {
    this.reportFile = path.join(__dirname, `/gitleaks-report-guid.${reportType}`)
    return this
  }

  public build (): string {
    return this.reportFile.trim()
  }
}
