import taskLib = require('azure-pipelines-task-lib/task');
import * as azdev from 'azure-devops-node-api/WebApi';
import { IProxyConfiguration, IRequestOptions } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces';

export function getEndpointUrl(name: string): string {
    const value = taskLib.getEndpointUrl(name, true) || undefined;
    if (value === undefined) throw Error(`GetEndpointUrl ${name} is empty`);
    return value;
}

export function getEndpointAuthorizationParameter(name: string, key: string): string {
    const value = taskLib.getEndpointAuthorizationParameter(name, key, true) || undefined;
    if (value === undefined) throw Error(`GetEndpointAuthorizationParameter ${name} is empty`);
    return value;
}

export function getAzureDevOpsVariable(name: string): string {
    const value = taskLib.getVariable(name) || undefined;
    if (value === undefined) throw Error(`Variable ${name} is empty`);
    return value;
}

export function getAzureDevOpsInput(name: string): string {
    const value = taskLib.getInput(name) || undefined;
    if (value === undefined) throw Error(`Input ${name} is empty`);
    return value;
}

export function getTime(date?: Date) {
    return date != null ? new Date(date).getTime() : 0;
}

export async function getAzureDevOpsConnection(collectionUri: string, token: string): Promise<azdev.WebApi> {
    const accessTokenHandler = azdev.getPersonalAccessTokenHandler(token);
    const requestOptions: IRequestOptions = {
        socketTimeout: 10000,
        allowRetries: true,
        maxRetries: 3,
    };

    const agentProxy = taskLib.getHttpProxyConfiguration();
    let proxyConfiguration: IProxyConfiguration;

    if (agentProxy) {
        proxyConfiguration = {
            proxyUrl: agentProxy.proxyUrl,
            proxyUsername: agentProxy.proxyUsername,
            proxyPassword: agentProxy.proxyPassword,
            proxyBypassHosts: agentProxy.proxyBypassHosts
        }
        requestOptions.proxy = proxyConfiguration;
    }

    const connection = new azdev.WebApi(collectionUri, accessTokenHandler, requestOptions)
    if (!connection) throw Error(`Connection cannot be made to Azure DevOps.`);
    return connection;
}
