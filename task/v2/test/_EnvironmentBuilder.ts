
export class EnvironmentBuilder {
  private readonly environmentSettings: EnvironmentSetting[] = []

  constructor () {
    this.environmentSettings.push(new EnvironmentSetting('Agent', 'value'))
    this.environmentSettings.push(new EnvironmentSetting('AGENT_TOOLSDIRECTORY', __dirname))
    this.environmentSettings.push(new EnvironmentSetting('AGENT_TEMPDIRECTORY', __dirname))
    this.environmentSettings.push(new EnvironmentSetting('AGENT_OS', 'Darwin'))
    this.environmentSettings.push(new EnvironmentSetting('AGENT_OSARCHITECTURE', 'x64'))
    this.environmentSettings.push(new EnvironmentSetting('BUILD_BUILDID', '123'))
    this.environmentSettings.push(new EnvironmentSetting('BUILD_REASON', 'Manual'))
    this.environmentSettings.push(new EnvironmentSetting('BUILD_REPOSITORY_ID', 'RepoId'))
    this.environmentSettings.push(new EnvironmentSetting('SYSTEM_DEBUG', 'false'))
    this.environmentSettings.push(new EnvironmentSetting('SYSTEM_TEAMPROJECT', 'MyTeamProject'))
    this.environmentSettings.push(new EnvironmentSetting('SYSTEM_JOBID', 'guid'))
    this.environmentSettings.push(new EnvironmentSetting('ENDPOINT_AUTH_SCHEME_SYSTEMVSSCONNECTION', 'OAuth'))
    this.environmentSettings.push(new EnvironmentSetting('ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN', 'Accesstoken'))
    this.environmentSettings.push(new EnvironmentSetting('ENDPOINT_URL_SYSTEMVSSCONNECTION', 'https://dev.azure.com/organisation'))
  }

  public withEnvironmentalSetting (key: string, value: string): EnvironmentBuilder {
    this.environmentSettings.push(new EnvironmentSetting(key, value))
    return this
  }

  public build (): void {
    for (const environment of this.environmentSettings) {
      process.env[environment.key] = environment.value
    }
  }
}

class EnvironmentSetting {
  public key: string
  public value: string
  constructor (key: string, value: string) {
    this.key = key
    this.value = value
  }
}
