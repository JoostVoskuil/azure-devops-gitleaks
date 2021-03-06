import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';


describe('Gitleaks Execution', function () {
    it('Should succeed when gitleaks find no leaks', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'Execution_ShouldSucceedWhenGitLeaksReturnsExitCodeZero.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should fail when gitleaks find leaks', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'Execution_ShouldFailWhenGitLeaksReturnsExitCodeOne.js');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.failed, true, 'should have failed');
        assert.strictEqual(tr.errorIssues.length, 1, "should have one error");
        assert.strictEqual(tr.stdout.indexOf('Leaks or error encountered. See log and report for details.') >= 0, true, "Should contain 'Leaks or error encountered. See log and report for details.'")
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
});

describe('Upload gitleaks results', function () {
    it('Should upload results when file exists and upload is set to true', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'UploadResults_ShouldUploadFileResults');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.failed, true, 'should have failed');
        assert.strictEqual(tr.errorIssues.length, 1, "should have one error");
        assert.strictEqual(tr.stdout.indexOf('##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;]') >= 0, true, "Should contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'")
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should not upload results when upload is set to false', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'UploadResults_ShouldNotUploadFileResultsWhenUploadIsOff');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.failed, true, 'should have failed');
        assert.strictEqual(tr.errorIssues.length, 1, "should have one error");
        assert.strictEqual(tr.stdout.indexOf('##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;]'), -1 , "Should not contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'")
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should not upload results when report file does not exist', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'UploadResults_ShouldNotUploadFileResultsWhenUploadIsOff');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.failed, true, 'should have failed');
        assert.strictEqual(tr.errorIssues.length, 1, "should have one error");
        assert.strictEqual(tr.stdout.indexOf('##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;]'), -1 , "Should not contain '##vso[artifact.upload containerfolder=gitleaks;artifactname=gitleaks;].'")
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
});

describe('Gitleaks parameter calls', function () {
    it('Should always provide the default parameters', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksCall_ShouldWorkWithDefaultParameters');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should provide the --verbose parameter to gitleaks when verbose flag is on', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksCall_ShouldWorkWithVerboseParameter');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should provide the --no-git parameter to gitleaks when nogit flag is on', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksCall_ShouldWorkWithNoGitParameter');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
});

describe('Provide Config files', function () {
    it('Should accept default config files', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'ConfigFiles_ShouldAcceptNoConfig');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should accept predefined config files', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'ConfigFiles_ShouldAcceptPredefinedConfig');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should succeed when existing custom config file is provided', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'ConfigFiles_ShouldAcceptCustomConfigFile');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        done();
    });
    it('Should fail when config file is not provided', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'ConfigFiles_ShouldFailWhenCustomConfigFileIsNotProvided');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.failed, true, 'should have failed');
        assert.strictEqual(tr.invokedToolCount, 0, 'Gitleaks tool should be invoked 0 time');
        assert.strictEqual(tr.errorIssues.length, 1, "should have one error");
        assert.strictEqual(tr.stdout.indexOf('Incorrect configuration set.') >= 0, true, "Should contain 'Incorrect configuration set.'")
        done();
    });
});

describe('Gitleaks Releases', function () {
    it('Should download Darwin/x64', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldWorkOnDarwinX64');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks-darwin-amd64') >= 0, true, "Should contain 'gitleaks-darwin-amd64'")
        done();
    });
    it('Should download WindowsNT/x86', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldWorkOnWindowsNTx86');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks-windows-386.exe') >= 0, true, "Should contain 'gitleaks-windows-386.exe'")
        done();
    });
    it('Should download WindowsNT/x64', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldWorkOnWindowsNTx64');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks-windows-amd64.exe') >= 0, true, "Should contain 'gitleaks-windows-amd64.exe'")
        done();
    });
    it('Should download Linux/x64', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldWorkOnLinuxx64');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks-linux-amd64') >= 0, true, "Should contain 'gitleaks-linux-amd64'")
        done();
    });
    it('Should download Linux/Arm', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldWorkOnLinuxArm');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks-linux-arm') >= 0, true, "Should contain 'gitleaks-linux-arm'")
        done();
    });
});

describe('Gitleaks versions', function () {
    it('Should get latest when input version is set to latest', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksVersion_ShouldDownloadedWhenLatest');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('https://github.com/zricethezav/gitleaks/releases/download/v10.0.0/') >= 0, true, "Should contain 'https://github.com/zricethezav/gitleaks/releases/download/v10.0.0/' (that is specified as latest)")
        done();
    });
    it('Should get version that is specified.', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksVersion_ShouldDownloadedWhenSpecified');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('https://github.com/zricethezav/gitleaks/releases/download/v9.0.0/') >= 0, true, "Should contain 'https://github.com/zricethezav/gitleaks/releases/download/v9.0.0/'")
        done();
    });
});

describe('Gitleaks toolcache', function () {
    it('Should download when gitleaks version is not in toolcache', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldDownloadWhenNotInToolCache');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks is not available in toolcache') >= 0, true, "Should contain 'gitleaks is not available in toolcache'.")
        done();
    });
    it('Should not download when gitleaks version is in toolcache.', function(done: Mocha.Done) {    
        const tp = path.join(__dirname, 'GitleaksRelease_ShouldNotDownloadWhenInToolCache');
        const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();
        assert.strictEqual(tr.succeeded, true, 'should have succeeded');
        assert.strictEqual(tr.invokedToolCount, 1, 'Gitleaks tool should be invoked 1 time');
        assert.strictEqual(tr.stdout.indexOf('gitleaks is already available in toolcache') >= 0, true, "gitleaks is already available in toolcache'")
        done();
    });
});