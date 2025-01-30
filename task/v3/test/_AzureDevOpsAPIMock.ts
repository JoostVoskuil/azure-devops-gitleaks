import type * as mr from 'azure-pipelines-task-lib/mock-run'
import type { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import type { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'

interface MockBuildApi {
  getBuildChanges(teamProject: string, buildId: number, continuationToken?: string, numberOfCommits?: number): Promise<Change[]>;
}

interface MockGitApi {
  getPullRequestCommits(repositoryId: string, pullRequestId: number, teamProject?: string): Promise<GitCommitRef[]>;
}

interface MockWebApi {
  getBuildApi(): Promise<MockBuildApi>;
  getGitApi(): Promise<MockGitApi>;
}

export class AzureDevOpsAPIMock {
  private readonly tmr: mr.TaskMockRunner;
  public defaultChanges: Change[];
  public defaultCommitRef: GitCommitRef[];

  constructor(tmr: mr.TaskMockRunner) {
    this.tmr = tmr;
    this.defaultChanges = [
      { id: 'firstCommitChange', type: 'commit' },
      { id: 'lastCommitChange', type: 'commit' }
    ];
    this.defaultCommitRef = [
      { commitId: 'firstCommitPr' },
      { commitId: 'lastCommitPr' }
    ];
  }

  public build(): mr.TaskMockRunner {
    return this.tmr;
  }

  public withAzureDevOpsAPIMock(changes: Change[] = this.defaultChanges, commits: GitCommitRef[] = this.defaultCommitRef): this {
    this.tmr.registerMock('azure-devops-node-api/WebApi', {
      getPersonalAccessTokenHandler: async (token: string): Promise<boolean> => true,
      WebApi: function(): MockWebApi {
        return {
          getBuildApi: async () => ({
            getBuildChanges: async (teamProject, buildId, continuationToken, numberOfCommits) => changes
          }),
          getGitApi: async () => ({
            getPullRequestCommits: async (repositoryId, pullRequestId, teamProject) => commits
          })
        };
      }
    });
    return this;
  }
}
