import type { TaskLibAnswers } from 'azure-pipelines-task-lib/mock-answer'
import type * as mr from 'azure-pipelines-task-lib/mock-run'
import * as mtr from 'azure-pipelines-task-lib/mock-toolrunner'

export class TaskMockBuilder {
  private readonly tmr: mr.TaskMockRunner
  private answers: TaskLibAnswers = {}

  constructor (tmr: mr.TaskMockRunner) {
    this.tmr = tmr
  }

  public build (): mr.TaskMockRunner {
    this.tmr.setAnswers(this.answers)
    return this.tmr
  }

  public withOfflineAgentMocks (): this {
    // Mock RESTClient for Version information
    this.tmr.registerMock('typed-rest-client/RestClient', {
      RestClient: function () {
        return {
          get: async function (url: string, options: string) {
            return { statusCode: 404 }
          }
        }
      }
    })
    this.tmr.registerMock('typed-rest-client/HttpClient', {
      HttpClient: function () {
        return {
          get: async function (url: string, options: string) {
            return {
              message: { statusCode: 404 }
            }
          }
        }
      }
    })

    this.tmr.registerMock('node:fs', {
      chmodSync: function (filePath: string, rights: string) { return true },
      existsSync: function (filePath: string) { return true },
      readFileSync: function (filePath: string) { return true }
    })
    return this
  }

  public withGitHubAPIMocks (): this {
    // Mock RESTClient for Version information
    this.tmr.registerMock('typed-rest-client/RestClient', {
      RestClient: function () {
        return {
          get: async function (url: string, options: string) {
            if (url === 'https://api.github.com/repos/zricethezav/gitleaks/releases') {
              return {
                result: [
                  { name: 'v8.9.0' },
                  { name: 'v8.9.1'},
                  { name: 'v8.9.10'},
                  { name: 'v9.1.10'},
                  { name: 'v8.10.0'},
                  { name: 'v8.7.0' },
                  { name: 'v8.2.1' }
                ],
                statusCode: 200
              }
            }
          }
        }
      }
    })
    this.tmr.registerMock('typed-rest-client/HttpClient', {
      HttpClient: function () {
        return {
          get: async function (url: string, options: string) {
            if (url === 'https://github.com') {
              return {
                message: { statusCode: 200 }
              }
            }
            if (url === 'https://github.com/gitleaks/gitleaks/releases/latest') {
              return {
                message: { 
                  statusCode: 404, 
                }
              }
            }
            throw Error('Wrong url')
          }
        }
      }
    })
    this.tmr.registerMock('node:fs', {
      chmodSync: function (filePath: string, rights: string) { return true },
      existsSync: function (filePath: string) { return true },
      readFileSync: function (filePath: string) { return true }
    })
    return this
  }

  public withOnlineAgentMocks (): this {
    this.tmr.registerMock('typed-rest-client/HttpClient', {
      HttpClient: function () {
        return {
          get: async function (url: string, options: string) {
            if (url === 'https://github.com') {
              return {
                message: { statusCode: 200 }
              }
            }
            if (url === 'https://github.com/gitleaks/gitleaks/releases/latest') {
              return {
                message: { 
                  statusCode: 200, 
                  req: { 
                    path: 'github.com/gitleaks/gitleaks/releases/tag/v8.10.0'
                  } 
                }
              }
            }
            throw Error('Wrong url')
          }
        }
      }
    })
    this.tmr.registerMock('node:fs', {
      chmodSync: function (filePath: string, rights: string) { return true },
      existsSync: function (filePath: string) { return true },
      readFileSync: function (filePath: string) { return true }
    })
    return this
  }

  public withDownloadFailure (): TaskMockBuilder {
    this.tmr.registerMock('azure-pipelines-tool-lib/tool', {
      downloadTool (url: string, downloadUri: string, toolExecutable: string) {
        throw new Error('download error')
      },
      cleanVersion: function (version: string) {
        return version
      },
      findLocalToolVersions: function (toolName: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return undefined
      },
      findLocalTool: function (toolName: string, versionSpec: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return undefined
      }

    })
    return this
  }

  public withEmptyToolCache (): this {
    this.tmr.registerMock('azure-pipelines-tool-lib/tool', {
      downloadTool (url: string, downloadUri: string, toolExecutable: string) {
        return '/tool'
      },
      extractTar (exe: string) {
        return '/tool'
      },
      extractZip (exe: string) {
        return '/tool'
      },
      findLocalTool: function (toolName: string, versionSpec: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return undefined
      },
      findLocalToolVersions: function (toolName: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return undefined
      },
      cleanVersion: function (version: string) {
        return version
      },
      cacheFile (fileGUID: string, toolExecutable: string, toolName: string, version: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return '/tool'
      }
    })
    return this
  }

  public withToolCache (): this {
    this.tmr.registerMock('azure-pipelines-tool-lib/tool', {
      downloadTool (url: string, downloadUri: string, toolExecutable: string) {
        return '/tool'
      },
      extractTar (exe: string) {
        return '/tool'
      },
      extractZip (exe: string) {
        return '/tool'
      },
      findLocalToolVersions: function (toolName: string): string[] {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
      return ['8.0.0', '8.10.0']
      },
      findLocalTool: function (toolName: string, versionSpec: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return '/tool'
      },
      cleanVersion: function (version: string) {
        return version
      },

      cacheFile (fileGUID: string, toolExecutable: string, toolName: string, version: string) {
        if (toolName !== 'gitleaks') throw new Error('Searching for wrong tool')
        return '/tool'
      }
    })
    return this
  }

  public withReport (reportFile: string, exists = true): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr)
    this.answers.exist = {
      [reportFile]: exists,
      'exists/gitleaks': true
    }
    return this
  }

  public withBaseline (baselinePath: string, exists = true): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr)
    this.answers.exist = {
      [baselinePath]: exists,
      'exists/gitleaks': true
    }
    return this
  }

  public withToolExecution (toolCall: string, exitCode = 0): this {
    this.tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr)
    this.answers.exec = {
      [toolCall]: {
        code: exitCode,
        stdout: 'Gitleaks tool console output'
      }
    }
    return this
  }
}