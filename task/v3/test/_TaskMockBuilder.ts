import type { TaskLibAnswers } from 'azure-pipelines-task-lib/mock-answer'
import type * as mr from 'azure-pipelines-task-lib/mock-run'
import * as mtr from 'azure-pipelines-task-lib/mock-toolrunner'

interface MockRestResponse<T> {
  result?: T;
  statusCode: number;
}

interface MockHttpResponse {
  message: {
    statusCode: number;
    req?: { path: string };
  };
}

interface MockToolResponse {
  code: number;
  stdout: string;
}

export class TaskMockBuilder {
  private readonly tmr: mr.TaskMockRunner;
  private readonly answers: TaskLibAnswers = {
    exist: {},
    exec: {}
  };

  constructor(tmr: mr.TaskMockRunner) {
    this.tmr = tmr;
  }

  public build(): mr.TaskMockRunner {
    this.tmr.setAnswers(this.answers);
    return this.tmr;
  }

  public withOfflineAgentMocks(): this {
    this.registerRestClientMock(async (url: string) => ({ statusCode: 404 }));
    this.registerHttpClientMock(async () => ({ message: { statusCode: 404 } }));
    this.registerFileSystemMock();
    return this;
  }

  public withGitHubAPIMocks(): this {
    this.registerRestClientMock(async (url: string) => {
      if (url === 'https://api.github.com/repos/zricethezav/gitleaks/releases') {
        return {
          result: [
            { name: 'v8.9.0' },
            { name: 'v8.9.1' },
            { name: 'v8.9.10' },
            { name: 'v9.1.10' },
            { name: 'v8.10.0' },
            { name: 'v8.7.0' },
            { name: 'v8.2.1' }
          ],
          statusCode: 200
        };
      }
      return { statusCode: 404 };
    });
    this.registerHttpClientMock(async (url: string) => {
      if (url === 'https://github.com') {
        return { message: { statusCode: 200 } };
      }
      if (url === 'https://github.com/gitleaks/gitleaks/releases/latest') {
        return { message: { statusCode: 404 } };
      }
      throw Error('Wrong url');
    });
    this.registerFileSystemMock();
    return this;
  }

  public withOnlineAgentMocks(): this {
    this.registerHttpClientMock(async (url: string) => {
      if (url === 'https://github.com') {
        return { message: { statusCode: 200 } };
      }
      if (url === 'https://github.com/gitleaks/gitleaks/releases/latest') {
        return {
          message: {
            statusCode: 200,
            req: { path: 'github.com/gitleaks/gitleaks/releases/tag/v8.20.0' }
          }
        };
      }
      throw Error('Wrong url');
    });
    this.registerFileSystemMock();
    return this;
  }

  public withDownloadFailure(): this {
    this.registerToolMock({
      downloadTool: () => { throw new Error('download error'); }
    });
    return this;
  }

  public withEmptyToolCache(): this {
    this.registerToolMock({});
    return this;
  }

  public withToolCache(): this {
    this.registerToolMock({
      findLocalToolVersions: () => ['8.0.0', '8.20.0'],
      findLocalTool: () => '/tool'
    });
    return this;
  }

  public withReport(reportFile: string, exists = true): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr);
    this.setFileExistence(reportFile, exists);
    return this;
  }

  public withBaseline(baselinePath: string, exists = true): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr);
    this.setFileExistence(baselinePath, exists);
    return this;
  }

  public withIgnoreFile(ignoreFile: string, exists = true): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr);
    this.setFileExistence(ignoreFile, exists);
    return this;
  }

  public withToolExecution(toolCall: string, exitCode = 0): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr);
    this.setToolExecution(toolCall, exitCode);
    return this;
  }

  private registerFileSystemMock(): void {
    this.tmr.registerMock('node:fs', {
      chmodSync: (filePath: string, rights: string) => true,
      existsSync: (filePath: string) => true,
      readFileSync: (filePath: string) => true
    });
  }

  private registerRestClientMock(responseBuilder: (url: string) => Promise<MockRestResponse<unknown>>): void {
    this.tmr.registerMock('typed-rest-client/RestClient', {
      RestClient: function() {
        return { get: responseBuilder };
      }
    });
  }

  private registerHttpClientMock(responseBuilder: (url: string) => Promise<MockHttpResponse>): void {
    this.tmr.registerMock('typed-rest-client/HttpClient', {
      HttpClient: function() {
        return { get: responseBuilder };
      }
    });
  }

  private registerToolMock(options: {
    downloadTool?: (url: string, downloadUri: string, toolExecutable: string) => string | never;
    findLocalToolVersions?: (toolName: string) => string[] | undefined;
    findLocalTool?: (toolName: string, versionSpec: string) => string | undefined;
    cacheFile?: (fileGUID: string, toolExecutable: string, toolName: string, version: string) => string;
  }): void {
    this.tmr.registerMock('azure-pipelines-tool-lib/tool', {
      downloadTool: options.downloadTool ?? (() => '/tool'),
      extractTar: () => '/tool',
      extractZip: () => '/tool',
      findLocalToolVersions: options.findLocalToolVersions ?? (() => undefined),
      findLocalTool: options.findLocalTool ?? (() => undefined),
      cleanVersion: (version: string) => version,
      cacheFile: options.cacheFile ?? (() => '/tool')
    });
  }

  private setFileExistence(path: string, exists: boolean): void {
    (this.answers.exist as Record<string, boolean>)[path] = exists;
    (this.answers.exist as Record<string, boolean>)['exists/gitleaks'] = true;
  }

  private setToolExecution(toolCall: string, exitCode: number): void {
    (this.answers.exec as Record<string, MockToolResponse>)[toolCall] = {
      code: exitCode,
      stdout: 'Gitleaks tool console output'
    };
  }
}