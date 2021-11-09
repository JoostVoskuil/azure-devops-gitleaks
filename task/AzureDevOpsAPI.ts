import { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'
import * as azdev from 'azure-devops-node-api/WebApi'
import { BuildApi } from 'azure-devops-node-api/BuildApi'
import fs = require('fs')
import Path = require('path')
import { Guid } from 'guid-typescript'
import taskLib = require('azure-pipelines-task-lib/task')

import { getAzureDevOpsConnection, getAzureDevOpsVariable, getEndpointAuthorizationParameter, getEndpointUrl } from './helpers'

export class AzureDevOpsAPI {
  private readonly buildId: string
  private readonly teamProject: string
  private readonly collectionUri: string
  private readonly token: string

  constructor () {
    this.buildId = getAzureDevOpsVariable('Build.BuildId')
    this.teamProject = getAzureDevOpsVariable('System.TeamProject')
    this.collectionUri = getEndpointUrl('SYSTEMVSSCONNECTION')
    this.token = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken')
    taskLib.setResourcePath(Path.join(__dirname, 'task.json'), true)
  }

  public async getBuildChangesInFile (agentTempDirectory: string, numberOfCommits: number): Promise<string> {
    // commitsFile
    const commitsFile = Path.join(agentTempDirectory, `commits-${Guid.create()}.txt`)
    taskLib.debug(taskLib.loc('CommitsFile', commitsFile))

    // Get changes
    const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token)
    const buildApi: BuildApi = await connection.getBuildApi()
    const changes: Change[] = await buildApi.getBuildChanges(this.teamProject, Number(this.buildId), undefined, numberOfCommits)
    const filteredChanges = changes.filter((x => x.type = 'commit') && (x => x.id !== undefined))

    taskLib.debug(taskLib.loc('DetectedChanges', filteredChanges.length))
    const commitsArray = filteredChanges.map(o => o.id).join('\n')
    // Writing File
    fs.writeFileSync(commitsFile, commitsArray)
    return commitsFile
  }
}
