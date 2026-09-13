import * as core from "@actions/core";
import {generateDeploymentEvidence} from "./generate-deployment-evidence.js";

try {
  const result = generateDeploymentEvidence(JSON.parse(core.getInput("result-json", {required: true})));
  core.setOutput("evidence-json", JSON.stringify(result));
  core.setOutput("terminal-status", result.terminalStatus);
  core.setOutput("rollback-status", result.rollbackStatus);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Deployment evidence invalid");
}
