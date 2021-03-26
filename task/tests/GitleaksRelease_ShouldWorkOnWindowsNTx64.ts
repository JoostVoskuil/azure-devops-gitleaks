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

// Agent settings
process.env['AGENT_OS'] = 'Windows_NT';
process.env['AGENT_OSARCHITECTURE'] = 'x64';
process.env['AGENT_TOOLSDIRECTORY'] = __dirname;
process.env['AGENT_TEMPDIRECTORY'] = __dirname;
const executable = 'gitleaks-windows-amd64.exe';

tmr = helpers.BuildWithEmptyToolCache(tmr);
tmr = helpers.BuildWithSucceedingToolExecution(tmr, executable);
tmr = helpers.BuildWithDefaultMocks(tmr);
tmr.run();
