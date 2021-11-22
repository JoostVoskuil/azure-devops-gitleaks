import * as mr from 'azure-pipelines-task-lib/mock-run';
import * as mtr from 'azure-pipelines-task-lib/mock-toolrunner';

import path = require('path');

import * as helpers from './MockHelper';
import { TaskLibAnswers } from 'azure-pipelines-task-lib/mock-answer';

const taskPath = path.join(__dirname, '..', 'index.js');
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('customtoollocation', '/customtoollocation');
tmr.setInput('configType', 'default');
tmr.setInput('version', 'latest');

tmr.setInput('scanfolder', __dirname);

tmr.setInput('redact', 'true');
tmr.setInput('verbose', 'false');
tmr.setInput('uploadresults', 'false');
tmr.setInput('taskfail', 'true');
tmr.setInput('taskfailonexecutionerror', 'true');

const executable = 'gitleaks-darwin-amd64';
const reportformat = 'json';
tmr.setInput('reportformat', reportformat);

helpers.BuildWithDefaultValues();
tmr = helpers.BuildWithEmptyToolCache(tmr);
tmr = helpers.BuildWithDefaultMocks(tmr);
tmr.registerMock('azure-pipelines-task-lib/toolrunner', mtr);

tmr.setAnswers(<TaskLibAnswers>{
        exec: {
                [createToolCall(reportformat)]: {
                        'code': 0,
                        'stdout': 'Gitleaks tool console output',
                },
        },
        exist: {
                [mockTool()]: true,
        },
});

tmr.run();

function mockTool(): string {
        return `/customtoollocation/${executable}`;
}

function createToolCall(reportformat: string): string {
        const toolCall = `/customtoollocation/${executable} --path=${__dirname} --report=${helpers.reportFile(reportformat)} --format=${reportformat} --redact`;
        return toolCall;
}