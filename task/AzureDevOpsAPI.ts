import taskLib = require('azure-pipelines-task-lib/task');
import { Change } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import * as azdev from 'azure-devops-node-api/WebApi';
import { BuildApi } from 'azure-devops-node-api/BuildApi';

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

	public async getBuildChanges(): Promise<string> {
		// Get changes
		const connection: azdev.WebApi = await getAzureDevOpsConnection(this.collectionUri, this.token);
		const buildApi: BuildApi = await connection.getBuildApi();
		const changes: Change[] = await buildApi.getBuildChanges(this.teamProject, Number(this.buildId));
		const filteredChanges = changes.filter((x => x.type = 'commit') && (x => x.id !== undefined));
		
		taskLib.debug(`Detected ${filteredChanges.length} Git changes for this build.`);
		return filteredChanges.map(o => o.id).join(',');
	}
}
