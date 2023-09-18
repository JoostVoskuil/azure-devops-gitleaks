import * as mr from 'azure-pipelines-task-lib/mock-run'

import path = require('path')
import { TaskInputBuilder } from './_TaskInputBuilder'
import { EnvironmentBuilder } from './_EnvironmentBuilder'
import { ToolCallBuilder } from './_ToolCallBuilder'
import { ReportBuilder } from './_ReportBuilder'
import { TaskMockBuilder } from './_TaskMockBuilder'
import { AzureDevOpsAPIMock } from './_AzureDevOpsAPIMock'

const taskPath = path.join(__dirname, '..', 'index.js')
let tmr: mr.TaskMockRunner = new mr.TaskMockRunner(taskPath)

const baselineFile = 'baselinefile.json'

new EnvironmentBuilder()
  .build()
tmr = new TaskInputBuilder(tmr)
  .withBaseLine(baselineFile)
  .build()

tmr = new AzureDevOpsAPIMock(tmr)
  .withAzureDevOpsAPIMock()
  .build()

const toolCall = new ToolCallBuilder()
  .withBaseLinePath(baselineFile)
  .build()

const reportCall = new ReportBuilder()
  .build()

tmr = new AzureDevOpsAPIMock(tmr)
  .withAzureDevOpsAPIMock()
  .build()

tmr = new TaskMockBuilder(tmr)
  .withOnlineAgentMocks()
  .withReport(reportCall, true)
  .withBaseline(baselineFile, true)
  .withToolExecution(toolCall, 0)
  .withEmptyToolCache()
  .build()

tmr.run()
