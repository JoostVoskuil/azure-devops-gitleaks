import * as path from "node:path"
import * as ttm from "azure-pipelines-task-lib/mock-test"
import assert from "node:assert"

describe("Gitleaks Execution", async () => {
  it("Should fail when gitleaks find leaks", async () => {
    const tp = path.join(__dirname, "Execution_ShouldFailWhenGitLeaksReturnsExitCodeOne.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.errorIssues.length, 1, "should have one errors")
    assert.strictEqual(tr.stdout.includes("loc_mock_ResultError"), true, "Should contain 'loc_mock_ResultError'")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should succeed when gitleaks find no leaks", async () => {
    const tp = path.join(__dirname, "Execution_ShouldSucceedWhenGitLeaksReturnsExitCodeZero.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should succeed with warning when gitleaks find leaks", async () => {
    const tp = path.join(__dirname, "Execution_ShouldWarningWhenGitLeaksReturnsExitCodeOne.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.stdout.includes("SucceededWithIssues"), true, "Should contain 'SucceededWithIssues'")
    assert.strictEqual(tr.stdout.includes("loc_mock_ResultError"), true, "Should contain 'loc_mock_ResultError'")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should fail when download error occurs", async () => {
    const tp = path.join(__dirname, "Execution_ShouldFailWhenDownloadError.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.errorIssues.length, 1, "should have one errors")
    assert.strictEqual(tr.stdout.includes("download error"), true, "Should contain 'download error'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked")
  })
  it("Should succeed with warnings when download error occurs", async () => {
    const tp = path.join(__dirname, "Execution_ShouldSucceedWarningWhenDownloadError.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.stdout.includes("SucceededWithIssues"), true, "Should contain 'SucceededWithIssues'")
    assert.strictEqual(tr.stdout.includes("download error"), true, "Should contain 'download error'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked")
  })
})

describe("Upload gitleaks results", async () => {
  it("Should upload results when file exists and upload is set to true", async () => {
    const tp = path.join(__dirname, "UploadResults_ShouldUploadFileResults")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_ResultError"), true, "Should contain 'loc_mock_ResultError'")
    assert.strictEqual(
      tr.stdout.includes("##vso[artifact.upload containerfolder=Gitleaks;artifactname=CodeAnalysisLogs;]"),
      true,
      "Should contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'"
    )
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should not upload results when upload is set to false", async () => {
    const tp = path.join(__dirname, "UploadResults_ShouldNotUploadFileResultsWhenUploadIsOff")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_ResultError"), true, "Should contain 'loc_mock_ResultError'")
    assert.strictEqual(
      tr.stdout.indexOf("##vso[artifact.upload containerfolder=Gitleaks;artifactname=gitleaks;]"),
      -1,
      "Should not contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'"
    )
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should not upload results when report file does not exist", async () => {
    const tp = path.join(__dirname, "UploadResults_ShouldNotUploadFileResultsWhenUploadIsOff")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_ResultError"), true, "Should contain 'loc_mock_ResultError'")
    assert.strictEqual(
      tr.stdout.indexOf("##vso[artifact.upload containerfolder=Gitleaks;artifactname=gitleaks;]"),
      -1,
      "Should not contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'"
    )
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
})

describe("Configuration Files", async () => {
  it("Should accept no config file", async () => {
    const tp = path.join(__dirname, "ConfigFiles_ShouldAcceptNoConfig")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should accept a predefined config file", async () => {
    const tp = path.join(__dirname, "ConfigFiles_ShouldAcceptPredefinedConfig")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should succeed when existing custom config file is provided", async () => {
    const tp = path.join(__dirname, "ConfigFiles_ShouldAcceptCustomConfigFile")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should fail when config file is not provided", async () => {
    const tp = path.join(__dirname, "ConfigFiles_ShouldFailWhenCustomConfigFileIsNotProvided")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should be invoked 0 time")
    assert.strictEqual(tr.errorIssues.length, 1, "should have one error")
    assert.strictEqual(tr.stdout.includes("loc_mock_IncorrectConfig"), true, "Should contain 'Incorrect configuration set.'")
  })
})

describe("Gitleaks parameter calls", async () => {
  it("Should provide the --verbose parameter to gitleaks when verbose flag is on", async () => {
    const tp = path.join(__dirname, "GitleaksCall_ShouldWorkWithVerboseParameter")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should provide the --redact parameter to gitleaks when redact flag is on", async () => {
    const tp = path.join(__dirname, "GitleaksCall_ShouldWorkWithRedactParameter")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should provide the --log-level debug parameter to gitleaks when system.debug is on", async () => {
    const tp = path.join(__dirname, "GitleaksCall_ShouldWorkWithSystemDebug")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should provide the --report-format to gitleaks when provided", async () => {
    const tp = path.join(__dirname, "GitleaksCall_ShouldWorkWithReportFormat")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should provide the correct report name to gitleaks when provided a custom name", async () => {
    const tp = path.join(__dirname, "GitleaksCall_ShouldWorkWithReportNameCustom")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
})

describe("Set scanmode", async () => {
  it("Should scan everything with scanmode all", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeAll")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should scan flat with scanmode nogit", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeNoGit")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should scan with provided logoptions when scanmode is custom", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeCustom")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should fail when logoptions are not provided and scanmode is custom", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeCustomNotProvidedShouldFail")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.stdout.includes("loc_mock_NoCommitsToScan"), true, "Should contain 'loc_mock_NoCommitsToScan'")
  })
  it("Should scan pre-validation builds when scanmode is prevalidation", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModePrevalidation")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should fail when scanmode is pre-validation builds but buildreason is manual", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModePrevalidationShouldFailWhenBuildReasonIsNotPullRequest")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_PreValidationBuildInvallid"), true, "Should contain 'loc_mock_PreValidationBuildInvallid'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked 0 time")
  })
  it("Should scan pre-validation builds when scanmode is smart and buildreason is pullrequest", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeSmartPullRequest")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should scan build changes when scanmode is smart and buildreason is manual", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeSmartManual")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should scan build changes when scanmode is changes", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeChanges")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should fail when scanmode is unknown", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanModeUnknown")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_UnknownScanMode"), true, "Should contain 'loc_mock_UnknownScanModet'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked 0 time")
  })
})

describe("Gitleaks Releases", async () => {
  it("Should download Darwin/x64", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldWorkOnDarwinX64")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("darwin_x64"), true, "Should contain 'darwin_x64'")
  })
  it("Should not download WindowsNT/x128 because Os/Arch not supported", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldFailOnOsArchNotSupported")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_OsArchNotSupported"), true, "Should contain 'loc_mock_OsArchNotSupported'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked 0 time")
  })
  it("Should download WindowsNT/x64", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldWorkOnWindowsNTx64")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("windows_x64"), true, "Should contain 'windows_x64'")
  })
  it("Should download WindowsNT/x32", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldWorkOnWindowsNTx86")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("windows_x32"), true, "Should contain 'windows_x32'")
  })
  it("Should download Linux/x64", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldWorkOnLinuxx64")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("linux_x64"), true, "Should contain 'linux_x64'")
  })
  it("Should download Linux/x32", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldWorkOnLinuxx86")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("linux_x32"), true, "Should contain 'linux_x32'")
  })
})

describe("Gitleaks Versions", async () => {
  it("Should get latest when input version is set to latest", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldDownloadedWhenLatest")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_OnlineAgentHasNotTheLatestVersion"), true, "Should contain 'loc_mock_OnlineAgentHasNotTheLatestVersion.'")
  })
  it("Should get version that is specified.", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldDownloadedWhenSpecified")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_NoToolcacheDownloading"), true, "Should contain 'loc_mock_NoToolcacheDownloading.'")
  })
  it("Should fail when version is lower then 8.19.0.", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldFailWhenVersionIsBelow8")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.stdout.includes("loc_mock_OnlySupportsGitLeaks8"), true, "Should contain 'loc_mock_OnlySupportsGitLeaks8'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked 0 time")
  })
  it("Should get Latest version through the GitHub API", async () => {
    const tp = path.join(__dirname, "GitLeaksVersion_ShouldQueryGitHubAPIWhenLatestPageIsUnavailable.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.stdout.includes("loc_mock_ErrorFetchingGitHub"), true, "Should contain 'loc_mock_ErrorFetchingGitHub'")
    assert.strictEqual(tr.stdout.includes("loc_mock_QueryingGitHubAPI"), true, "Should contain 'loc_mock_QueryingGitHubAPI'")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
})

describe("Gitleaks custom location", async () => {
  it("Should fail when custom tool cannot be found", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldFailWhenCustomToolLocationCanNotBeFound.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, false, "should have failed")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should be invoked 0 times")
    assert.strictEqual(tr.stdout.includes("loc_mock_GitLeaksNotFound"), true, "customLocation/gitleaks-darwin-amd64'")
  })
  it("Should succeed with custom tool as input parameter", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldSucceedWithCustomLocationInput.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
  it("Should succeed with custom tool as variabele", async () => {
    const tp = path.join(__dirname, "GitleaksVersion_ShouldSucceedWithCustomLocationVariable.js")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })
})

describe("Gitleaks toolcache", async () => {
  it("Should download when gitleaks version is not in toolcache", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldDownloadWhenNotInToolCache")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_NoToolcacheDownloading"), true, "Should contain 'loc_mock_NoToolcacheDownloading'.")
  })
  it("Should not download when gitleaks version is in toolcache.", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldNotDownloadWhenInToolCache")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_AvailableInToolcache"), true, "Should contain 'loc_mock_AvailableInToolcache'.")
  })

  it("Should not download when gitleaks version is in toolcache and that is the latest version.", async () => {
    const tp = path.join(__dirname, "GitleaksRelease_ShouldNotDownloadWhenInToolCacheAndLatest")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_OnlineAgentHasLatestVersion"), true, "loc_mock_OnlineAgentHasLatestVersion'")
  })
})

describe("Gitleaks with Offline Agent", async () => {
  it("Should take the latest version in toolcache when agent is offline", async () => {
    const tp = path.join(__dirname, "GitleaksOfflineAgent_TakeLatestVersionShouldSucceed")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
    assert.strictEqual(tr.stdout.includes("loc_mock_OfflineAgent"), true, "Should contain 'loc_mock_OfflineAgent'.")
  })

  it("Should fail when there is no version in toolcache and agent is offline", async () => {
    const tp = path.join(__dirname, "GitleaksOfflineAgent_TakeLatestVersionShouldFail")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.succeeded, false, "should have failed")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should be invoked 0 times")
    assert.strictEqual(tr.stdout.includes("loc_mock_OfflineAgentToolNotAvailable"), true, "Should contain 'loc_mock_OfflineAgentToolNotAvailable'.")
  })
})

describe("Baseline file", async () => {
  it("Should be called with baseline file Path", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanWithBaseline")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.stdout.includes("--baseline-path"), true, "Should contain '--baseline-path'.")
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should be called with gitleaksignore file", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanWithGitLeaksIgnoreFile")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.stdout.includes("--gitleaks-ignore-path="), true, "Should contain '--gitleaks-ignore-path='.")
    assert.strictEqual(tr.succeeded, true, "should have succeeded")
    assert.strictEqual(tr.invokedToolCount, 1, "Gitleaks tool should be invoked 1 time")
  })

  it("Should fail when baseline file does not exists", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanWithBaselineFileNotFound")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.errorIssues.length, 1, "should have one errors")
    assert.strictEqual(tr.stdout.includes("loc_mock_BaselinePathDoesNotExists"), true, "Should contain 'loc_mock_BaselinePathDoesNotExists'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked")
  })

  it("Should be called with gitleaksignore file does not exist", async () => {
    const tp = path.join(__dirname, "Gitleaks_ScanWithGitLeaksIgnoreFileNotFound")
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
    await tr.runAsync()
    assert.strictEqual(tr.failed, true, "should have failed")
    assert.strictEqual(tr.errorIssues.length, 1, "should have one errors")
    assert.strictEqual(tr.stdout.includes("loc_mock_IgnoreFilePathDoesNotExists"), true, "Should contain 'loc_mock_IgnoreFilePathDoesNotExists'")
    assert.strictEqual(tr.invokedToolCount, 0, "Gitleaks tool should not be invoked")
  })
})
