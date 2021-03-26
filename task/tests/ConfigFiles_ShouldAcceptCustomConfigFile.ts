import * as mr from 'azure-pipelines-task-lib/mock-run';


import path = require('path');
import os = require('os');
import * as helpers from './MockHelper';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
const configFile = `customFile.toml`
const executable = 'gitleaks-darwin-amd64';

tmr.setInput('version', 'latest');
tmr.setInput('configType', 'custom');

tmr.setInput('scanfolder', __dirname);
tmr.setInput('configfile', configFile);

tmr.setInput('nogit', 'false');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'true');

helpers.BuildWithDefaultValues();
tmr = helpers.BuildWithEmptyToolCache(tmr);
tmr = helpers.BuildWithSucceedingToolExecution(tmr, executable, configFile, true);
tmr = helpers.BuildWithDefaultMocks(tmr);
tmr.run();
