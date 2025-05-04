# Changelog

## Task version 3.3
- Update NPM dependencies
- Update config

## Task version 3.2

- Fix bug. Removed detect (because it is deprecated)
- Update NPM dependencies
- Update config

## Task version 3.1

- Default config is now default task setting

## Task version 3

- Only compatible with GitLeaks 8.19.0 and higher. Uses the new command structure
- Update dependencies
- Update configs
- Introduced 'gitLeaksIgnoreFilePath' parameter to specify the GitLeaks Ignore Path

## Taks version 2

### 2.13

- Update dependencies
- Update config

### 2.12

- Fix config
- Update config

### 2.11

- No longer supporting Node10 agents

### 2.10

- Fixed broken definitions (See https://github.com/JoostVoskuil/azure-devops-gitleaks/pull/87). Thanx @rgmz
- Update definitions
- Update node dependencies
- Switched to Biome linter and dropped eslint
- Added Node20 support
- Added comment that the baseline report should be in json format (thanx @GlashelderWhatever)

### 2.9

- Update definitions
- Update node dependencies

### 2.8

- Update definitions
- Update node dependencies
- Added reportfolder parameter to customize report location
- Added reportartifactname parameter to customize artifact location
- Fixed bug, put log options between quotes

### 2.7

- Fixed GitHub API throttling issue.
- Update node dependencies

### 2.6.2

- Update node dependencies
- Added feature to add a baseline file, see #73
- Update definitions
- Fixed code smells

### 2.5.4

- Update node dependencies
- Update definitions
- Bugfix #69 (Not quite bugfix but it will throw an message to the console instead of error)

### 2.5.3

- Update node dependencies
- Bugfix #65

### 2.5.1

- Update node dependencies
- Update toml files

### 2.5.0

- Update node dependencies
- Include parameter

### 2.4.5

- Updated node dependencies
- Updated GitleaksUdmCombo.toml
- Added Node16 support (Minimal Agent required is 2.144.0)
- Retry for 3 times to handle API throttling for GitHub. When Throttled it waits for 30 seconds

### 2.2.16

- Updated Config File (GitleaksUdmCombo.toml)

### 2.2.15

- Updated Config File (GitleaksUdmCombo.toml)

### 2.2.13

- Updated NPM Packages
- Add custom report name

### 2.2.3

- Switched to path inputs

### 2.2

- Updated GitleaksUdmCombo.toml / Gitleaks 8.2.3 version
- Support for 32 bit OS (Gitleaks v8.1.2)
- Random GUID in report name is replaced by the GUID of the System.JobId

### 2.1

- Only support GitLeaks 8 and up, please note that GitLeaks 8 does not provide binaries for 32-bit architectures so the task will only work on x64 architectures
- Made configuration of the task easier by providing a 'scanmode' picklist
- Sarif is now default reporting option of the task
- Reports will be uploaded to the 'CodeAnalysisLogs' artifact of de pipeline, regardless of the report-format
- Redact is now default turned on. GitLeaks's default is off however, the reports are stored in Azure DevOps, hence this is default turned on.
- GitleaksUdmCombo.toml is now set as default configuration file, combining GitLeaks default configuration and the Credscan alike configuration by Jesse Houwing
- GitLeaks 8 is made simpler, so the extra arguments input field is removed
- Provided input field for additional log-options
- When the pipeline runs in debug mode (system.debug=true), GitLeaks will be also run in debug mode.

## Task version 1

Task v1 is only compatible with gitleaks v7. Since this version is no longer downloadable from GitHub Task V1 will no longer work and provided with this extension.
