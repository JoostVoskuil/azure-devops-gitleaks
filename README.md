# Gitleaks

Thanks to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.

Thanks to [Jesse Houwing](https://github.com/jessehouwing) for providing a gitleaks config that has most of Microsoft's deprecated credscan rules ported to it.

Thanks to John Lokkerse for providing feedback.

This Azure DevOps task downloads gitleaks and runs a gitleak scan on the specified location. It can only scan already checked-out repo's on the agent because it is currently not possible to scan Azure DevOps repo-urls. See [this github issue](https://github.com/zricethezav/gitleaks/issues/440) for more information.

## YAML Snippet

```yaml
# Run Gitleaks on Source Repository
- task: Gitleaks@1
  inputs:
    scanfolder: '$(Build.SourcesDirectory)'
```

## Contributions

Any feedback on gitleaks, please reach out to [Zachary Rice](https://github.com/zricethezav) for creating and maintaining gitleaks.

Any feedback on the Azure configuration file ('UDMSecretChecks.toml') is welcome.
See [Jesse Houwing's github repo](https://github.com/jessehouwing/gitleaks-azure)

The configuration file isn't as good as credscan was before, it had a bunch of helper functions to rule out false positives that aren't (yet) possible with gitleaks.

## Arguments

| Name | Description |
|-|-|
| scanfolder | The location to be scanned. Defaults to $(Build.SourcesDirectory). This is passed to gitleaks as '--path=' |
| configtype | Can be 'default', 'predefined' or 'custom'. 'default' is using the default gitleaks setup. When set to 'predefined' you can pass the argument 'predefinedconfigfile'. When set to 'custom' you need to pass the argument 'configfile' with the filename of your gitleaks config file. |
| predefinedconfigfile | When set to 'UDMSecretChecks.toml' it uses the Credscan config file provided by Jesse Houwing. |
| configfile | Sets the custom configfile in your repo. Use a relative path within the scanfolder. Example: '.github/gitleaks.config' |
| verbose | When set to true, gitleaks prints verbose output. |
| nogit |  When set to true, gitleaks will be executed with the --no-git option. |
| uploadresults | When set to true, the results of gitleaks (in JSON) will be uploaded as an artifact to Azure DevOps. |
| version | Version of Gitleaks to be used. See the gitleaks github page. Set to 'latest' to download the latest version of gitleaks. |

## How do I remove a secret from git's history?

[Github](https://docs.github.com/en/github/authenticating-to-github/removing-sensitive-data-from-a-repository) has a great article on this using the [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/).
