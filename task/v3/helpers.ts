import * as path from 'node:path'
import taskLib = require('azure-pipelines-task-lib/task')
import * as azdev from 'azure-devops-node-api/WebApi'
import type { IProxyConfiguration, IRequestOptions } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'

taskLib.setResourcePath(path.join(__dirname, 'task.json'), true)

function throwIfMissing<T>(value: T | undefined, errorKey: string, name: string): T {
  if (value === undefined) throw Error(taskLib.loc(errorKey, name))
  return value
}

type TaskLibGetter = {
  endpoint: typeof taskLib.getEndpointUrl
  auth: typeof taskLib.getEndpointAuthorizationParameter
  variable: typeof taskLib.getVariable
  input: typeof taskLib.getInput
  pathInput: typeof taskLib.getPathInput
}

const getters: TaskLibGetter = {
  endpoint: taskLib.getEndpointUrl,
  auth: taskLib.getEndpointAuthorizationParameter,
  variable: taskLib.getVariable,
  input: taskLib.getInput,
  pathInput: taskLib.getPathInput
}

// Public API remains unchanged
export function getEndpointUrl(name: string): string {
  return throwIfMissing(getters.endpoint(name, true), 'GetEndpointUrlEmpty', name)
}

export function getEndpointAuthorizationParameter(name: string, key: string): string {
  return throwIfMissing(getters.auth(name, key, true), 'GetEndpointAuthorizationParameterEmpty', name)
}

export function getAzureDevOpsVariable(name: string): string {
  return throwIfMissing(getters.variable(name), 'VariableEmpty', name)
}

export function isSemanticVersionGreaterOrEqualThen(versionA: string, versionB: string): boolean {
  const v1 = versionA.split('.').map(Number)
  const v2 = versionB.split('.').map(Number)
  const len = Math.max(v1.length, v2.length)

  for (let i = 0; i < len; i++) {
    const a = v1[i] || 0
    const b = v2[i] || 0
    if (a < b) return false
    if (a === b) return true
    if (a > b) return true
  }
  return false
}

export function getAzureDevOpsInput(name: string): string {
  return throwIfMissing(getters.input(name), 'InputEmpty', name)
}

export function getAzureDevOpsPathInput(name: string): string {
  return throwIfMissing(getters.pathInput(name), 'InputEmpty', name)
}

export function getRequestOptions(): IRequestOptions {
  const requestOptions: IRequestOptions = {
    socketTimeout: 10000,
    allowRetries: true,
    maxRetries: 3
  }

  const agentProxy = taskLib.getHttpProxyConfiguration()
  if (agentProxy) {
    requestOptions.proxy = {
      proxyUrl: agentProxy.proxyUrl,
      proxyUsername: agentProxy.proxyUsername,
      proxyPassword: agentProxy.proxyPassword,
      proxyBypassHosts: agentProxy.proxyBypassHosts
    }
  }
  return requestOptions
}

export async function getAzureDevOpsConnection(collectionUri: string, token: string): Promise<azdev.WebApi> {
  const connection = new azdev.WebApi(
    collectionUri,
    azdev.getPersonalAccessTokenHandler(token),
    getRequestOptions()
  )
  return throwIfMissing(connection, 'AdoConnectionError', '')
}
