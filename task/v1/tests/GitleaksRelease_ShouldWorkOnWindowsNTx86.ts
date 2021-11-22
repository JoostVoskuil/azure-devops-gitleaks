import * as mr from 'azure-pipelines-task-lib/mock-run';

import path = require('path');
import * as helpers from './MockHelper';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('version', 'latest');
tmr.setInput('configType', 'default');
tmr.setInput('scanfolder', __dirname);
tmr.setInput('reportformat', 'json');

tmr.setInput('nogit', 'false');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'false');
tmr.setInput('taskfailonexecutionerror', 'true');

// Agent settings
process.env['AGENT_OS'] = 'Windows_NT';
process.env['AGENT_OSARCHITECTURE'] = 'x86';
process.env['AGENT_TOOLSDIRECTORY'] = __dirname;
process.env['AGENT_TEMPDIRECTORY'] = __dirname;
process.env['BUILD_REASON'] = 'manual';
process.env['SYSTEM_TEAMPROJECT'] = 'TESTTP';
process.env['SYSTEMVSSCONNECTION'] = 'VSSCONNECTION';
process.env['ENDPOINT_AUTH_SYSTEMVSSCONNECTION'] = 'VSSCONNECTION';
process.env['ENDPOINT_URL_SYSTEMVSSCONNECTION'] = 'URL';
process.env['ENDPOINT_AUTH_SCHEME_SYSTEMVSSCONNECTION'] = 'SCHEME';
process.env['ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN'] = 'ACCESSTOKEN';

const executable = 'gitleaks-windows-386.exe';

tmr = helpers.BuildWithEmptyToolCache(tmr);
tmr = helpers.BuildWithSucceedingToolExecution(tmr, executable);
tmr = helpers.BuildWithDefaultMocks(tmr);
tmr.run();
