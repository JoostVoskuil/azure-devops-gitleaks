import * as mr from 'azure-pipelines-task-lib/mock-run';


import path = require('path');
import os = require('os');
import * as helpers from './MockHelper';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('version', 'latest');
tmr.setInput('configType', 'default');
tmr.setInput('scanfolder', __dirname);

tmr.setInput('nogit', 'false');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'false');

const executable = 'gitleaks-darwin-amd64';

helpers.BuildWithDefaultValues();
tmr.registerMock('azure-pipelines-tool-lib/tool', {
        downloadTool(url) {
                return '/tool';
        },
        findLocalTool: function (toolName, versionSpec) {
                if (toolName != 'gitleaks') {
                        throw new Error('Searching for wrong tool');
                }
                return '/tool';
        },
        cleanVersion: function (version) {
                return version;
        },
});

tmr = helpers.BuildWithSucceedingToolExecution(tmr, executable);
tmr = helpers.BuildWithDefaultMocks(tmr);
tmr.run();
