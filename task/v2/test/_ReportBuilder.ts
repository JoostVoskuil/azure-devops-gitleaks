import path = require('path')
export class ReportBuilder {
  private reportFile: string

  constructor () {
    this.reportFile = path.join(__dirname, '/gitleaks-report-guid.sarif')
  }

  public withReportFormat (reportType: string): ReportBuilder {
    this.reportFile = path.join(__dirname, `/gitleaks-report-guid.${reportType}`)
    return this
  }

  public build (): string {
    return this.reportFile.trim()
  }
}
