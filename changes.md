Replaced `rm -rf` to use rimraf package - it allows developing regardless of OS type
Bump node packages to the latest
Added tags to manifest
Added `ts-node` to run locally for dev testing
Moved strings to `messages` section to use with loc
Added predefined - GitleaksUdmCombo.toml (Gitleaks defaults + UDM)
Added support for report format
If report format is sarif then upload to artifact to `CodeAnalysisLogs` - nice report presentation with [SARIF SAST Scans Tab](https://marketplace.visualstudio.com/items?itemName=sariftools.scans)
Added support for depth
Fixed typo in tests `contsole` -> `console`
Tests adjusted to report format
Added tests for sarif report format upload and end with warring