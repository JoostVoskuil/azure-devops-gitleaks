
import * as azdev from 'azure-devops-node-api/WebApi'
import { BuildApi } from 'azure-devops-node-api/BuildApi'
import { GitApi } from 'azure-devops-node-api/GitApi'
import fs = require('fs')
import Path = require('path')
import { Guid } from 'guid-typescript'
import taskLib = require('azure-pipelines-task-lib/task')

import { getAzureDevOpsConnection, getAzureDevOpsVariable, getEndpointAuthorizationParameter, getEndpointUrl } from './helpers'
import { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export class AzureDevOpsAPI {
  private readonly teamProject: string
  private readonly collectionUri: string
  private readonly token: string

  constructor () {
    this.teamProject = getAzureDevOpsVariable('System.TeamProject')
    this.collectionUri = getEndpointUrl('SYSTEMVSSCONNECTION')
    this.token = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken')
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  public async getBuildChangesCommits (numberOfCommits: number): Promise<string> {
    // variablen
    const buildId = Number(getAzureDevOpsVariable('Build.BuildId'))

    // Get changes
    const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token)
    const buildApi: BuildApi = await connection.getBuildApi()
    const changes: Change[] = await buildApi.getBuildChanges(this.teamProject, buildId, undefined, numberOfCommits)
    const filteredCommits = changes.filter(x => x.id !== undefined)
    taskLib.debug(taskLib.loc('DetectedChanges', filteredCommits.length))
    const commitsArray = filteredCommits.map(o => o.id).join('\n')
    return this.writeCommitFile(commitsArray)
  }

  public async getPullRequestCommits (): Promise<string> {
    // variablen
    const repositoryId = getAzureDevOpsVariable('Build.Repository.ID')
    const pullRequestId = Number(getAzureDevOpsVariable('System.PullRequest.PullRequestId'))

    // Get changes
    const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token)
    const gitApi: GitApi = await connection.getGitApi()
    const commits: GitCommitRef[] = await gitApi.getPullRequestCommits(repositoryId, pullRequestId, this.teamProject)
    const filteredCommits = commits.filter(x => x.commitId !== undefined)

    taskLib.debug(taskLib.loc('DetectedChanges', filteredCommits.length))
    const commitsArray = filteredCommits.map(o => o.commitId).join('\n')
    return this.writeCommitFile(commitsArray)
  }

  private writeCommitFile (commitsArray: string): string {
    taskLib.debug(taskLib.loc('Commits', commitsArray))
    const agentTempDirectory = getAzureDevOpsVariable('Agent.TempDirectory')
    const commitsFilePath = Path.join(agentTempDirectory, `commits-${String(Guid.create())}.txt`)
    taskLib.debug(taskLib.loc('CommitsFile', commitsFilePath))

    fs.writeFileSync(commitsFilePath, commitsArray)
    return commitsFilePath
  }
}
