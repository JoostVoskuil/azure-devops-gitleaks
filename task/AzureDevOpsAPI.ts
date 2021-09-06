import taskLib = require('azure-pipelines-task-lib/task');
import { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import * as azdev from 'azure-devops-node-api/WebApi';
import { BuildApi } from 'azure-devops-node-api/BuildApi';
import fs = require('fs');
import Path = require('path');
import { Guid } from "guid-typescript";

import { getAzureDevOpsConnection, getAzureDevOpsVariable, getEndpointAuthorizationParameter, getEndpointUrl } from './helpers';

export class AzureDevOpsAPI {
	private buildId: string;
	private teamProject: string
	private collectionUri: string
	private token: string

	constructor() {
		this.buildId = getAzureDevOpsVariable('Build.BuildId');
		this.teamProject = getAzureDevOpsVariable('System.TeamProject');
		this.collectionUri = getEndpointUrl('SYSTEMVSSCONNECTION');
		this.token = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken');
	}

	public async getBuildChangesInFile(agentTempDirectory: string): Promise<string> {
		//commitsFile
		const commitsFile = Path.join(agentTempDirectory, `commits-${Guid.create()}.txt`);

		// Get changes
		const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token);
		const buildApi: BuildApi = await connection.getBuildApi();
		const changes: Change[] = await buildApi.getBuildChanges(this.teamProject, Number(this.buildId));
		const filteredChanges = changes.filter((x => x.type = 'commit') && (x => x.id !== undefined));
		
		console.debug(`Detected ${filteredChanges.length} Git changes for this build.`);
		const commitsArray = filteredChanges.map(o => o.id).join('\n');
		//Writing File
		console.debug(`CommitsFile is set to ${commitsFile}`);
		fs.writeFileSync(commitsFile, commitsArray);
		return commitsFile
	}
}
