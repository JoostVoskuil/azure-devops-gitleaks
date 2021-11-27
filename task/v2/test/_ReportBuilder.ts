export class ReportBuilder {
  private reportFile = new String()

  constructor () {
    this.reportFile = `${__dirname}/gitleaks-report-guid.sarif`
  }

  public withReportFormat (reportType: string): ReportBuilder {
    this.reportFile = `${__dirname}/gitleaks-report-guid.${reportType}`
    return this
  }

  public build () {
    return this.reportFile.trim()
  }
}
