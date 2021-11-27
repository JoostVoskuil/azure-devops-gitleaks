import * as mr from 'azure-pipelines-task-lib/mock-run'
import path = require('path')
import { TaskInputBuilder } from './_TaskInputBuilder'
import { EnvironmentBuilder } from './_EnvironmentBuilder'
import { ToolCallBuilder } from './_ToolCallBuilder'
import { TaskMockBuilder } from './_TaskMockBuilder'
import { AzureDevOpsAPIMock } from './_AzureDevOpsAPIMock'

const taskPath = path.join(__dirname, '..', 'index.js')
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath)

new EnvironmentBuilder()
        .build();
tmr = new TaskInputBuilder(tmr)
        .build();

tmr = new AzureDevOpsAPIMock(tmr)
        .withAzureDevOpsAPIMock()
        .build()

const toolCall = new ToolCallBuilder()
        .build()

tmr = new TaskInputBuilder(tmr)
        .build();

tmr = new AzureDevOpsAPIMock(tmr)
        .withAzureDevOpsAPIMock()
        .build()

tmr = new TaskMockBuilder(tmr)
        .withOnlineAgentMocks()
        .withToolExecution(toolCall, 1)
        .withEmptyToolCache()
        .build()

tmr.run();
