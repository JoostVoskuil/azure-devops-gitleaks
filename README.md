# Gitleaks

This Azure DevOps task downloads gitleaks and runs a gitleak scan on the specified location. 

- Thanks to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.
- Thanks to [Jesse Houwing](https://github.com/jessehouwing) for providing a gitleaks config that has most of Microsoft's deprecated credscan rules ported to it.

Please note that task v1 will no longer work since gitleaks v7 is no longer downloadable.

## YAML Snippet

```yaml
# Run Gitleaks on Source Repository
- task: Gitleaks@2
  inputs:
    scanlocation: '$(Build.SourcesDirectory)'
    configtype: 'predefined'
    predefinedconfigfile: 'GitleaksUdmCombo.toml'
    reportformat: 'sarif'
```

## Prerequisites

- Linux/Osx based agents requires tar to unpack Gitleaks from GitHub
- Windows based agents require zip to unpack Gitleaks from GitHub

## Original Authors

Any feedback on gitleaks, please reach out to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.

Any feedback on the Azure configuration file ('UDMSecretChecks.toml') is welcome. See [Jesse Houwing's GitHub repo](https://github.com/jessehouwing/gitleaks-azure). 
*The configuration file isn't as good as credscan was before, it had a bunch of helper functions to rule out false positives that aren't (yet) possible with gitleaks.*

## Contributions

Thanks to [Dariusz Porowski](https://github.com/DariuszPorowski) for contributing and making awesome adjustments!

Thanks to John Lokerse for providing feedback on this extension.

## Arguments for Version 2 of the Task

| Name | Description |
| :-----|:------------ |
| scanlocation | The location to be scanned.<br/>Defaults to $(Build.SourcesDirectory). |
| configtype | Can be 'default', 'predefined', 'custom'.<br/>'default' for GitLeaks default configuration.<br/>'predefined' allows you to select a predefined configurations.<br/>'custom' allows you to set a custom configuration file. |
| predefinedconfigfile | Can be 'UDMSecretChecksv8.toml' or 'GitleaksUdmCombo.toml'.<br/>'UDMSecretChecksv8.toml' uses the Credscan config file provided by Jesse Houwing.<br/>'GitleaksUdmCombo.toml' uses the default GitLeaks configuration icm the CredScan configuration.|
| configfile | Sets the custom configfile in your repo. |
| scanmode | 'all' will scan all commits.<br/>'prevalidation' will scan only the commits that are part of a Pull Request.<br/>'changes' will scan only the changes between this build and the previous build.<br/>'smart' will detect the best scanmode.<br/>'nogit' will run GitLeaks in no-git mode (flat file scan).<br/>'custom' will allow you to provide custom -log-opts.|
| logoptions | When scanmode is set to 'custom', this allows you to fill in custom log-options that are passed to GitLeaks |
| redact | Redact secrets from log messages and leaks. Default is `true`. |
| taskfail | Sets the behavior of the task when secrets are detected.<br/>When set to `true`, fail the task. When set to `false` and secrets present end with warning. Default is `true` |
| uploadresults | When set to `true`, the results of gitleaks will be uploaded as an artifact to Azure DevOps. Default is `true`.|
| reportformat | Sets gitleaks report format. Default is 'sarif'). |
| reportname | Sets the report file name. Default this will be 'gitleaks-<newguid>.<reportextension> |
| verbose | When set to `true`, gitleaks prints verbose output. Default is `false`. |
| version | Version of Gitleaks to be used. See the GitLeaks GitHub page.<br/>Set to 'latest' to download the latest version of GitLeaks. |
| customtoollocation | You can set the custom location of GitLeaks. When set, GitLeaks will not be downloaded but fetched from this location.|
| taskfailonexecutionerror | Sets the behavior of the task when execution errors occurs.<br/>When set to `true`, fail the task. When set to `false` and the tasks fails to execute the task is SuccededWithWarnings. Default is `true` |


### Notes for GitHub repositories:
- Only Git repositories hosted in Azure DevOps are supported for prevalidation/smart scanning mode. This is because the extension fetches the Pull Request changes from the Azure DevOps API. The API has no knowledge on the PR's on GitHub.

## SARIF display in Summary

You can display gitleaks report nicely in your Pipeline run summary. To realize it set `reportformat` to `sarif` and make sure your Azure DevOps organization has [SARIF SAST Scans Tab](https://marketplace.visualstudio.com/items?itemName=sariftools.scans) extension installed.

## How do I remove a secret from git's history?

[GitHub](https://docs.github.com/en/github/authenticating-to-github/removing-sensitive-data-from-a-repository) has a great article on this using the [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/).
