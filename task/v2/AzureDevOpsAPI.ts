
import type * as azdev from 'azure-devops-node-api/WebApi'
import type { BuildApi } from 'azure-devops-node-api/BuildApi'
import type { GitApi } from 'azure-devops-node-api/GitApi'
import Path = require('node:path')
import taskLib = require('azure-pipelines-task-lib/task')

import { getAzureDevOpsConnection, getAzureDevOpsVariable, getEndpointAuthorizationParameter, getEndpointUrl } from './helpers'
import type { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import type { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export class AzureDevOpsAPI {
  private readonly teamProject: string
  private readonly collectionUri: string
  private readonly token: string

  constructor() {
    this.teamProject = getAzureDevOpsVariable('System.TeamProject')
    this.collectionUri = getEndpointUrl('SYSTEMVSSCONNECTION')
    this.token = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken')
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  public async getBuildChangesCommits(numberOfCommits: number): Promise<CommitDiff | undefined> {
    const buildId = Number(getAzureDevOpsVariable('Build.BuildId'))
    // Get changes
    const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token)
    const buildApi: BuildApi = await connection.getBuildApi()
    const changes: Change[] = await buildApi.getBuildChanges(this.teamProject, buildId, undefined, numberOfCommits)
    if (changes === null || changes === undefined || changes.length === 0) { return undefined }
    taskLib.debug(taskLib.loc('DetectedChanges', changes.length))
    const filteredCommits = changes.filter(x => x.id !== undefined)
    if (filteredCommits === null || filteredCommits === undefined || filteredCommits.length === 0) { return undefined }
    const commitDiff: CommitDiff = {
      lastCommit: filteredCommits[0].id,
      firstCommit: filteredCommits[filteredCommits.length - 1].id
    }
    console.log(taskLib.loc('ScanningCommits', filteredCommits.length, commitDiff.firstCommit, commitDiff.lastCommit))
    return commitDiff
  }

  public async getPullRequestCommits(): Promise<CommitDiff | undefined> {
    const repositoryId = getAzureDevOpsVariable('Build.Repository.ID')
    const pullRequestId = Number(getAzureDevOpsVariable('System.PullRequest.PullRequestId'))
    const repositoryProvider = getAzureDevOpsVariable('Build.Repository.Provider')

    if (repositoryProvider === 'TfsGit') {
      // Get changes
      const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token)
      const gitApi: GitApi = await connection.getGitApi()
      const commits: GitCommitRef[] = await gitApi.getPullRequestCommits(repositoryId, pullRequestId, this.teamProject)
      if (commits === null || commits === undefined || commits.length === 0) { return undefined }
      taskLib.debug(taskLib.loc('DetectedChanges', commits.length))
      const filteredCommits = commits.filter(x => x.commitId !== undefined)
      if (filteredCommits === null || filteredCommits === undefined || filteredCommits.length === 0) { return undefined }
      const commitDiff: CommitDiff = {
        lastCommit: filteredCommits[0].commitId,
        firstCommit: filteredCommits[filteredCommits.length - 1].commitId
      }
      console.log(taskLib.loc('ScanningCommits', filteredCommits.length, commitDiff.firstCommit, commitDiff.lastCommit))
      return commitDiff
    }
    
      taskLib.warning(taskLib.loc('NotGitRepository', repositoryProvider))
      return undefined
  }
}

export interface CommitDiff {
  firstCommit: string | undefined
  lastCommit: string | undefined
}
