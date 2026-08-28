import * as core from "@actions/core";
import {generateEvidence} from "./generate-evidence.js";
import {normalizeResults} from "./normalize-results.js";
import type {CheckResult} from "./contracts/types.js";

try {
  const checks = JSON.parse(core.getInput("checks", {required: true})) as CheckResult[];
  const evidence = generateEvidence({...JSON.parse(core.getInput("evidence", {required: true})), checks});
  const normalized = normalizeResults(checks);
  core.setOutput("readiness", normalized.readiness);
  core.setOutput("failure-category", normalized.failureCategory ?? "");
  core.setOutput("evidence-metadata", JSON.stringify(evidence));
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Result normalization failed");
}
