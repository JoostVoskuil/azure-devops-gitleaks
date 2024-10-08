import * as mr from 'azure-pipelines-task-lib/mock-run'

import path = require('node:path')
import { TaskInputBuilder } from './_TaskInputBuilder'
import { EnvironmentBuilder } from './_EnvironmentBuilder'
import { TaskMockBuilder } from './_TaskMockBuilder'
import { AzureDevOpsAPIMock } from './_AzureDevOpsAPIMock'

const taskPath = path.join(__dirname, '..', 'index.js')
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath)

new EnvironmentBuilder()
  .build()
tmr = new TaskInputBuilder(tmr)
  .withTaskFailOnExecutionError(false)
  .build()

tmr = new AzureDevOpsAPIMock(tmr)
  .withAzureDevOpsAPIMock()
  .build()

tmr = new AzureDevOpsAPIMock(tmr)
  .withAzureDevOpsAPIMock()
  .build()

tmr = new TaskMockBuilder(tmr)
  .withOnlineAgentMocks()
  .withDownloadFailure()
  .build()

tmr.run()
