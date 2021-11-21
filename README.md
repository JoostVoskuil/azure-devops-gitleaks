# Gitleaks

This Azure DevOps task downloads gitleaks and runs a gitleak scan on the specified location. It can only scan already checked-out repo's on the agent because it is currently not possible to scan Azure DevOps repo-urls. See [this github issue](https://github.com/zricethezav/gitleaks/issues/440) for more information.

- Thanks to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.
- Thanks to [Jesse Houwing](https://github.com/jessehouwing) for providing a gitleaks config that has most of Microsoft's deprecated credscan rules ported to it.

## YAML Snippet

```yaml
# Run Gitleaks on Source Repository
- task: Gitleaks@1
  inputs:
    scanfolder: '$(Build.SourcesDirectory)'
```

## Original Authors

Any feedback on gitleaks, please reach out to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.

Any feedback on the Azure configuration file ('UDMSecretChecks.toml') is welcome. See [Jesse Houwing's github repo](https://github.com/jessehouwing/gitleaks-azure). 
*The configuration file isn't as good as credscan was before, it had a bunch of helper functions to rule out false positives that aren't (yet) possible with gitleaks.*

## Contributions

Thanks to [Dariusz Porowski](https://github.com/DariuszPorowski) for contributing and making awesome adjustments!

Thanks to John Lokerse for providing feedback on this extension.

## Arguments

| Name                 | Description                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| scanfolder           | The location to be scanned. Defaults to $(Build.SourcesDirectory). This is passed to gitleaks as '--path='                                                                                                                                                                            |
| configtype           | Can be 'default', 'predefined', 'custom'. 'default' is using the default gitleaks setup. When set to 'predefined' you can pass the argument 'predefinedconfigfile'. When set to 'custom' you need to pass the argument 'configfile' with the filename of your gitleaks config file.|
| predefinedconfigfile | When set to 'UDMSecretChecks.toml' it uses the Credscan config file provided by Jesse Houwing.                                                                                                                                                                                        |
| configfile           | Sets the custom configfile in your repo. Use a relative path within the scanfolder. Example: 'config/gitleaks.toml'                                                                                                                                                                   |
| verbose              | When set to true, gitleaks prints verbose output.                                                                                                                                                                                                                                     |
| nogit                | When set to true, gitleaks will be executed with the --no-git option.                                                                                                                                                                                                                 |
| scanonlychanges      | When set to true, gitleaks will scan only the changes for this Build. It fetches the changes between this build and the previous build from the Azure DevOps API.                                                                                                                                                |
| depth                | Sets number of commits to scan.                                                                                                                                                                                        |
| reportformat         | Sets gitleaks report format: JSON, CSV, SARIF (default: json)                                                                                                                                                                                                                         |
| uploadresults        | When set to true, the results of gitleaks will be uploaded as an artifact to Azure DevOps.                                                                                                                                                                                            |
| redact               | Redact secrets from log messages and leaks.                                                                                                                                                                                                                                           |
| taskfail             | Sets the behavior of the task when secrets are detected. When set to `true`, fail the task. When set to `false` and secrets present end with warning. Default is true                                                                                                                                 |
| taskfailonexecutionerror             | Sets the behavior of the task when execution errors occurs. When set to `true`, fail the task. When set to `false` and the tasks fails to execute the task is skipped. Default is true                                                                                                                                 |

| arguments            | Provide extra arguments to gitleaks. See [GitHub](https://github.com/zricethezav/gitleaks#usage-and-options)                                                                                                                                                                          |
| version              | Version of Gitleaks to be used. See the gitleaks github page. Set to 'latest' to download the latest version of gitleaks.                                                                                                                                                             |

## SARIF display in Summary

You can display gitleaks report nicely in your Pipeline run summary. To realize it set `reportformat` to `sarif` and make sure your Azure DevOps organization has [SARIF SAST Scans Tab](https://marketplace.visualstudio.com/items?itemName=sariftools.scans) extension installed.

## How do I remove a secret from git's history?

[Github](https://docs.github.com/en/github/authenticating-to-github/removing-sensitive-data-from-a-repository) has a great article on this using the [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/).

## Changelog

### 1.6

- Refactored all the code
- Downloading from GitHub is now proxy aware
- Can handle agents with no internet connection
- Made boolean input 'taskfailonexecutionerror' if the task should fail when there is an execution error.

### 1.5

- Added 'Pre-Validation' Build mode. When the build is run as part of a pull request ony the commits for the pull request are scanned

### 1.4

- Add option for a custom tool location (so no download)
- Task input parameters are grouped
- Updated UDMSecretChecks.toml and GitleaksUdmCombo.toml to latest v7 structure (thanks to Dariusz Porowski)
- Fixed bug that scanonlychanges (--commit-file) and depth cannot work together
- Fixed bug that reportype was a mandatory parameter, will default in code to json
- Protection against Gitleaks v8, Gitleaks v7 will be the latest version supported by this major version of this task. For Gitleaks v8 there will be a newer version of this task.

### 1.3

- Merged Pullrequest from Dariusz Porowski:
  - Bumped node packages to the latest
  - Added tags to manifest
  - Added ts-node to run locally for dev testing
  - Moved strings to messages section to use with loc
  - Added predefined - GitleaksUdmCombo.toml (Gitleaks defaults + UDM)
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
- Added argument field to pass more options to gitleaks
- Added option to scan only for changes between this build and the previous build
- Bumped node packages to the latest
### 1.1

- First public release
### 1.0

- Initial version, not public