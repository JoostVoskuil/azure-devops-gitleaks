import path = require('node:path');

export class ReportBuilder {
  private static readonly DEFAULT_NAME = 'gitleaks-report-guid';
  private static readonly DEFAULT_TYPE = 'sarif';
  private readonly baseDir: string;
  private reportFile: string;

  constructor() {
    this.baseDir = __dirname;
    this.reportFile = this.buildPath(ReportBuilder.DEFAULT_TYPE, ReportBuilder.DEFAULT_NAME);
  }

  public withReportName(reportType: string, reportName: string): this {
    this.validateInputs(reportType, reportName);
    this.reportFile = this.buildPath(reportType, reportName);
    return this;
  }

  public withReportFormat(reportType: string): ReportBuilder {
    this.validateInputs(reportType);
    this.reportFile = this.buildPath(reportType, ReportBuilder.DEFAULT_NAME);
    return this;
  }

  public build(): string {
    return this.reportFile.trim();
  }

  private validateInputs(reportType: string, reportName?: string): void {
    if (!reportType?.trim()) {
      throw new Error('Report type cannot be empty');
    }
    if (reportName !== undefined && !reportName.trim()) {
      throw new Error('Report name cannot be empty when provided');
    }
  }

  private buildPath(type: string, name: string): string {
    return path.join(this.baseDir, `/${name}.${type}`);
  }
}
