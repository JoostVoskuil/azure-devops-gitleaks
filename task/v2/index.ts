import * as path from "node:path"
import taskLib = require("azure-pipelines-task-lib/task")

async function run(): Promise<void> {
  taskLib.setResourcePath(path.join(__dirname, "task.json"), true)
  taskLib.error(taskLib.loc("TaskIsDeprecated"))
  taskLib.setResult(taskLib.TaskResult.Failed, taskLib.loc("TaskIsDeprecatedFailure"))
}

void run()
