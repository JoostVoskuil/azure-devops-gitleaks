import * as mr from 'azure-pipelines-task-lib/mock-run';


import path = require('path');
import os = require('os');
import * as helpers from './MockHelper';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('version', 'latest');
tmr.setInput('configType', 'predefined');
tmr.setInput('predefinedconfigfile', 'UDMSecretChecks.toml');

tmr.setInput('scanfolder', __dirname);

tmr.setInput('nogit', 'false');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'false');

const executable = 'gitleaks-darwin-amd64';
const configFile = `${path.join(__dirname, '../')}configs/UDMSecretChecks.toml`

helpers.BuildWithDefaultValues();
tmr = helpers.BuildWithEmptyToolCache(tmr);
tmr = helpers.BuildWithSucceedingToolExecution(tmr, executable, configFile);
tmr = helpers.BuildWithDefaultMocks(tmr);

tmr.run();
