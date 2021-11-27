/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as mr from 'azure-pipelines-task-lib/mock-run'
import { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export class AzureDevOpsAPIMock {
  private readonly tmr: mr.TaskMockRunner
  public defaultChanges: Change[] = []
  public defaultCommitRef: GitCommitRef[] = []
  constructor (tmr: mr.TaskMockRunner) {
    this.tmr = tmr
    this.defaultChanges = [{ id: 'firstCommitChange' }, { id: 'lastCommitChange' }]
    this.defaultCommitRef = [{ commitId: 'firstCommitPr' }, { commitId: 'lastCommitPr' }
    ]
  }

  public build (): mr.TaskMockRunner {
    return this.tmr
  }

  public withAzureDevOpsAPIMock (changes?: Change[], commits?: GitCommitRef[]): AzureDevOpsAPIMock {
    // Mock WebApi
    if (changes === undefined) changes = this.defaultChanges
    if (commits === undefined) commits = this.defaultCommitRef
    this.tmr.registerMock('azure-devops-node-api/WebApi', {
      getPersonalAccessTokenHandler: async function (token: string) {
        return true
      },
      WebApi: function () {
        return {
          getBuildApi: async function () {
            return {
              getBuildChanges: async function (teamProject: string, buildId: number, continuationToken?: string, numberOfCommits?: number) {
                return changes
              }
            }
          },
          getGitApi: async function () {
            return {
              getPullRequestCommits: async function (repositoryId: string, pullRequestId: number, teamProject?: string) {
                return commits
              }
            }
          }
        }
      }

    })
    return this
  }
}

/* eslint-enable @typescript-eslint/no-inferrable-types */
/* eslint-enable @typescript-eslint/no-unused-vars */
