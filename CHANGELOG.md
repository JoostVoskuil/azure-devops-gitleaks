# Changelog

## Taks version 2

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

### 1.7.1

- Fixed v1 bug where extension cannot be installed for Azure DevOps server because of incorrect configuration of the input fields
### 1.7

- Last 1.x version
- Minor bugfixes
### 1.6

- Refactored all the code, sorry if that introduced some bugs
- Downloading from GitHub is now proxy aware
- Can handle agents with no internet connection; searches in toolcache
- Made boolean input 'taskfailonexecutionerror' if the task should fail when there is an execution error.

### 1.5

- Added 'Pre-Validation' Build mode. When the build is run as part of a pull request ony the commits for the pull request are scanned

### 1.4

- Add option for a custom tool location (so no download)
- Task input parameters are grouped
- Updated UDMSecretChecks.toml and GitleaksUdmCombo.toml to latest v7 structure (thanks to Dariusz Porowski)
- Fixed bug that scanonlychanges (--commit-file) and depth cannot work together
- Fixed bug that reportype was a mandatory parameter, will default in code to json
- Protection against GitLeaks v8, GitLeaks v7 will be the latest version supported by this major version of this task. For GitLeaks v8 there will be a newer version of this task.

### 1.3

- Merged Pullrequest from Dariusz Porowski:
  - Bumped node packages to the latest
  - Added tags to manifest
  - Added ts-node to run locally for dev testing
  - Moved strings to messages section to use with loc
  - Added predefined - GitleaksUdmCombo.toml (GitLeaks defaults + UDM)
  - Added support for report format
  - If report format is sarif then upload to artifact to CodeAnalysisLogs - nice report presentation with SARIF SAST Scans Tab extension
  - Added support for depth
  - Added support for taskfail
  - Fixed typo in tests contsole -> console
  - Tests adjusted to report format
  - Added tests for sarif report format upload and end with warring
  - Codebase lint with ts-standard
  
### 1.2

- Added redact option to redact secrets from output
- Added argument field to pass more options to GitLeaks
- Added option to scan only for changes between this build and the previous build
- Bumped node packages to the latest

### 1.1

- First public release

### 1.0

- Initial version, not public