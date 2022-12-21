# Changelog

## Taks version 2

### 2.4.2

- Updated node dependencies
- Updated GitleaksUdmCombo.toml
- Added Node16 support (Minimal Agent required is 2.144.0)

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