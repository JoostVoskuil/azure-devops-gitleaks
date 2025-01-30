enum EnvironmentKey {
  AGENT = 'Agent',
  AGENT_TOOLS_DIRECTORY = 'AGENT_TOOLSDIRECTORY',
  AGENT_TEMP_DIRECTORY = 'AGENT_TEMPDIRECTORY',
  AGENT_OS = 'AGENT_OS',
  AGENT_OS_ARCHITECTURE = 'AGENT_OSARCHITECTURE',
  BUILD_BUILD_ID = 'BUILD_BUILDID',
  BUILD_REASON = 'BUILD_REASON',
  BUILD_REPOSITORY_ID = 'BUILD_REPOSITORY_ID',
  BUILD_REPOSITORY_PROVIDER = 'BUILD.REPOSITORY.PROVIDER',
  SYSTEM_DEBUG = 'SYSTEM_DEBUG',
  SYSTEM_TEAM_PROJECT = 'SYSTEM_TEAMPROJECT',
  SYSTEM_JOB_ID = 'SYSTEM_JOBID',
  ENDPOINT_AUTH_SCHEME = 'ENDPOINT_AUTH_SCHEME_SYSTEMVSSCONNECTION',
  ENDPOINT_AUTH_TOKEN = 'ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN',
  ENDPOINT_URL = 'ENDPOINT_URL_SYSTEMVSSCONNECTION'
}

class EnvironmentSetting {
  constructor(
    public readonly key: EnvironmentKey | string,
    public readonly value: string
  ) {}
}

export class EnvironmentBuilder {
  private readonly environmentSettings: EnvironmentSetting[] = [];

  constructor() {
    const defaultSettings: Array<[EnvironmentKey, string]> = [
      [EnvironmentKey.AGENT, 'value'],
      [EnvironmentKey.AGENT_TOOLS_DIRECTORY, __dirname],
      [EnvironmentKey.AGENT_TEMP_DIRECTORY, __dirname],
      [EnvironmentKey.AGENT_OS, 'Darwin'],
      [EnvironmentKey.AGENT_OS_ARCHITECTURE, 'x64'],
      [EnvironmentKey.BUILD_BUILD_ID, '123'],
      [EnvironmentKey.BUILD_REASON, 'Manual'],
      [EnvironmentKey.BUILD_REPOSITORY_ID, 'RepoId'],
      [EnvironmentKey.BUILD_REPOSITORY_PROVIDER, 'Git'],
      [EnvironmentKey.SYSTEM_DEBUG, 'false'],
      [EnvironmentKey.SYSTEM_TEAM_PROJECT, 'MyTeamProject'],
      [EnvironmentKey.SYSTEM_JOB_ID, 'guid'],
      [EnvironmentKey.ENDPOINT_AUTH_SCHEME, 'OAuth'],
      [EnvironmentKey.ENDPOINT_AUTH_TOKEN, 'Accesstoken'],
      [EnvironmentKey.ENDPOINT_URL, 'https://dev.azure.com/organisation']
    ];

    for (const [key, value] of defaultSettings) {
      this.environmentSettings.push(new EnvironmentSetting(key, value));
    }
  }

  public withEnvironmentalSetting(key: EnvironmentKey | string, value: string): this {
    this.environmentSettings.push(new EnvironmentSetting(key, value));
    return this;
  }

  public build(): void {
    for (const env of this.environmentSettings) {
      process.env[env.key] = env.value;
    }
  }
}
