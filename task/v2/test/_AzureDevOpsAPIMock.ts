import type * as mr from 'azure-pipelines-task-lib/mock-run'
import type { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import type { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export class AzureDevOpsAPIMock {
  private readonly tmr: mr.TaskMockRunner
  public defaultChanges: Change[] = []
  public defaultCommitRef: GitCommitRef[] = []
  constructor (tmr: mr.TaskMockRunner) {
    this.tmr = tmr
    this.defaultChanges = [{ id: 'firstCommitChange', type: 'commit' }, { id: 'lastCommitChange', type: 'commit' }]
    this.defaultCommitRef = [{ commitId: 'firstCommitPr' }, { commitId: 'lastCommitPr' }
    ]
  }

  public build (): mr.TaskMockRunner {
    return this.tmr
  }

  public withAzureDevOpsAPIMock (changes?: Change[], commits?: GitCommitRef[]): this {
    // Mock WebApi
    const localChanges = changes === undefined ? this.defaultChanges : changes
    const localCommits = commits === undefined ? this.defaultCommitRef : commits

    this.tmr.registerMock('azure-devops-node-api/WebApi', {
      getPersonalAccessTokenHandler: async function (token: string) {
        return true
      },
      WebApi: function () {
        return {
          getBuildApi: async function () {
            return {
              getBuildChanges: async function (teamProject: string, buildId: number, continuationToken?: string, numberOfCommits?: number) {
                return localChanges
              }
            }
          },
          getGitApi: async function () {
            return {
              getPullRequestCommits: async function (repositoryId: string, pullRequestId: number, teamProject?: string) {
                return localCommits
              }
            }
          }
        }
      }

    })
    return this
  }
}
