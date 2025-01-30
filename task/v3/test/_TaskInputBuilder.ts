import type * as mr from 'azure-pipelines-task-lib/mock-run'
import path = require('node:path')

enum ConfigType {
  DEFAULT = 'default',
  PREDEFINED = 'predefined',
  CUSTOM = 'custom'
}

enum ScanMode {
  ALL = 'all',
  PREVALIDATION = 'prevalidation',
  CHANGES = 'changes',
  SMART = 'smart',
  NOGIT = 'nogit',
  CUSTOM = 'custom'
}

enum ReportFormat {
  SARIF = 'sarif',
  CSV = 'csv',
  JSON = 'json'
}

export class TaskInputBuilder {
  private static readonly DEFAULT_CONFIG_FILE = 'GitleaksUdmCombo.toml';
  private static readonly DEFAULT_REPORT_ARTIFACT = 'CodeAnalysisLogs';
  private readonly tmr: mr.TaskMockRunner;

  constructor(tmr: mr.TaskMockRunner) {
    this.tmr = tmr;
    this.setDefaultInputs();
  }

  public build(): mr.TaskMockRunner {
    return this.tmr;
  }

  public withPredefinedConfigFile(file: string): this {
    this.setConfigInputs(ConfigType.PREDEFINED, file);
    return this;
  }

  public withCustomConfigFile(file?: string): this {
    this.setConfigInputs(ConfigType.CUSTOM, file ?? '');
    return this;
  }

  public withBaseLine(baselinePath: string): this {
    this.tmr.setInput('baseLinePath', baselinePath);
    return this;
  }

  public withGitleaksIgnoreFile(ignoreFile: string): this {
    this.tmr.setInput('gitLeaksIgnoreFilePath', ignoreFile);
    return this;
  }

  public withScanMode(scanmode: string): this {
    this.tmr.setInput('scanmode', scanmode);
    return this;
  }

  public withLogOptions(logoptions: string): this {
    this.setScanInputs(ScanMode.CUSTOM, logoptions);
    return this;
  }

  public withRedact(redact: boolean): this {
    this.tmr.setInput('redact', String(redact));
    return this;
  }

  public withTaskFail(fail: boolean): this {
    this.tmr.setInput('taskfail', String(fail));
    return this;
  }

  public withUploadResults(uploadResults: boolean): this {
    this.tmr.setInput('uploadresults', String(uploadResults));
    return this;
  }

  public withReportFormat(reportFormat: string): this {
    this.tmr.setInput('reportformat', reportFormat);
    return this;
  }

  public withVerbose(verbose: boolean): this {
    this.tmr.setInput('verbose', String(verbose));
    return this;
  }

  public withTaskFailOnExecutionError(error: boolean): this {
    this.tmr.setInput('taskfailonexecutionerror', String(error));
    return this;
  }

  public withVersion(version: string): this {
    this.tmr.setInput('version', version);
    return this;
  }

  public withCustomToolLocationInput(toolLocation: string): this {
    this.tmr.setInput('customtoollocation', toolLocation);
    return this;
  }

  public withCustomToolLocationVariable(toolLocation: string): this {
    process.env.AGENT_TOOLSGITLEAKSDIRECTORY = toolLocation;
    return this;
  }

  private setDefaultInputs(): void {
    this.setConfigInputs(ConfigType.DEFAULT, TaskInputBuilder.DEFAULT_CONFIG_FILE);
    this.setScanInputs(ScanMode.ALL, '');
    this.setReportingInputs(ReportFormat.SARIF, __dirname, TaskInputBuilder.DEFAULT_REPORT_ARTIFACT);
    this.setExecutionInputs(true, true, false, 'latest');
  }

  private setConfigInputs(type: ConfigType, configFile: string): void {
    this.tmr.setInput('configtype', type);
    this.tmr.setInput('predefinedconfigfile', type === ConfigType.PREDEFINED ? configFile : '');
    this.tmr.setInput('configfile', type === ConfigType.CUSTOM ? configFile : '');
  }

  private setScanInputs(mode: ScanMode, logOptions: string): void {
    this.tmr.setInput('scanmode', mode);
    this.tmr.setInput('logoptions', logOptions);
    this.tmr.setInput('scanlocation', path.join(__dirname, '../'));
  }

  private setReportingInputs(format: ReportFormat, folder: string, artifactName: string): void {
    this.tmr.setInput('reportformat', format);
    this.tmr.setInput('reportfolder', folder);
    this.tmr.setInput('reportartifactname', artifactName);
    this.tmr.setInput('uploadresults', 'true');
    this.tmr.setInput('redact', 'false');
  }

  private setExecutionInputs(taskFail: boolean, failOnError: boolean, verbose: boolean, version: string): void {
    this.tmr.setInput('taskfail', String(taskFail));
    this.tmr.setInput('taskfailonexecutionerror', String(failOnError));
    this.tmr.setInput('verbose', String(verbose));
    this.tmr.setInput('version', version);
  }
}
