import * as mr from 'azure-pipelines-task-lib/mock-run';


import path = require('path');
import os = require('os');
import * as helpers from './MockHelper';
import { TaskLibAnswers } from 'azure-pipelines-task-lib/mock-answer';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('version', 'latest');
tmr.setInput('configType', 'default');
tmr.setInput('scanfolder', __dirname);

tmr.setInput('nogit', 'false');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'true');

const executable = 'gitleaks-darwin-amd64';

helpers.BuildWithDefaultValues();

tmr = helpers.BuildWithEmptyToolCache(tmr);

tmr.setAnswers(<TaskLibAnswers>{
        exec: {
                [helpers.createToolCall(executable)]: {
                        'code': 0,
                        'stdout': 'Gitleaks tool contsole output',
                },
        },
});
tmr = helpers.BuildWithDefaultMocks(tmr);

tmr.run();
