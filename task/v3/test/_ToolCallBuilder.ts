import path = require('node:path');

enum ArgumentPosition {
  EXECUTABLE = 0,
  COMMAND = 1,
  SOURCE = 2,
  CONFIG = 3,
  LOG_OPTS = 4,
  REDACT = 5,
  LOG_LEVEL = 6,
  REPORT_FORMAT = 7,
  REPORT_PATH = 8,
  NO_GIT = 9,
  VERBOSE = 10,
  BASELINE = 11,
  IGNOREFILE = 12,
  EXIT_CODE = 13
}

type ToolArguments = Partial<Record<ArgumentPosition, string>>;

export class ToolCallBuilder {
  private static readonly DEFAULT_EXECUTABLE = '/tool/gitleaks';
  private static readonly DEFAULT_COMMAND = 'git';
  private static readonly DEFAULT_EXIT_CODE = '99';
  
  private readonly arguments: ToolArguments;

  constructor() {
    this.arguments = {
      [ArgumentPosition.EXECUTABLE]: ToolCallBuilder.DEFAULT_EXECUTABLE,
      [ArgumentPosition.COMMAND]: ToolCallBuilder.DEFAULT_COMMAND,
      [ArgumentPosition.SOURCE]: `${path.join(__dirname, '../')}`,
      [ArgumentPosition.REPORT_FORMAT]: '--report-format=sarif',
      [ArgumentPosition.REPORT_PATH]: `--report-path=${path.join(__dirname, '/gitleaks-report-guid.sarif')}`,
      [ArgumentPosition.EXIT_CODE]: `--exit-code=${ToolCallBuilder.DEFAULT_EXIT_CODE}`
    };
  }

  public withVerbose(): this {
    this.setArgument(ArgumentPosition.VERBOSE, '--verbose');
    return this;
  }

  public withCustomTool(): this {
    this.setArgument(ArgumentPosition.EXECUTABLE, 'exists/gitleaks');
    return this;
  }

  public withDirectory(): this {
    this.setArgument(ArgumentPosition.COMMAND, 'directory');
    return this;
  }

  public withDebug(): this {
    this.setArgument(ArgumentPosition.LOG_LEVEL, '--log-level=debug');
    return this;
  }

  public withRedact(): this {
    this.setArgument(ArgumentPosition.REDACT, '--redact');
    return this;
  }

  public withLogOptions(logOptions: string): this {
    this.setArgument(ArgumentPosition.LOG_OPTS, `--log-opts=${logOptions}`);
    return this;
  }

  public withConfigPath(configPath: string): this {
    this.setArgument(ArgumentPosition.CONFIG, `--config=${configPath}`);
    return this;
  }

  public withReportFormat(reportFormat: string): this {
    this.updateReportPath(reportFormat);
    return this;
  }

  public withBaseLinePath(baselineFile: string): this {
    this.setArgument(ArgumentPosition.BASELINE, `--baseline-path=${baselineFile}`);
    return this;
  }

  public withIgnoreFilePath(ignoreFile: string): this {
    this.setArgument(ArgumentPosition.IGNOREFILE, `--gitleaks-ignore-path=${ignoreFile}`);
    return this;
  } 

  public withWindowsExecutable(): this {
    this.setArgument(ArgumentPosition.EXECUTABLE, '/tool/gitleaks.exe');
    return this;
  }

  private setArgument(position: ArgumentPosition, value: string): void {
    this.arguments[position] = value;
  }

  private updateReportPath(format: string): void {
    const reportFile = `/gitleaks-report-guid.${format}`;
    this.setArgument(ArgumentPosition.REPORT_FORMAT, `--report-format=${format}`);
    this.setArgument(ArgumentPosition.REPORT_PATH, `--report-path=${path.join(__dirname, reportFile)}`);
  }

  public build(): string {
    return Object.values(this.arguments)
      .filter(arg => arg !== undefined)
      .join(' ')
      .trim();
  }
}
