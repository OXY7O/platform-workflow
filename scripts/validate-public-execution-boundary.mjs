import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parse} from "yaml";

const approvedRunner = "ubuntu-24.04";
const forbiddenRunnerLabels = new Set(["self-hosted", "platform-ci"]);
const forbiddenField = /ssh|kubeconfig|target[_-]?host|private[_-]?key/i;
const immutableReference = /@[0-9a-f]{40}$/;

function visit(value, location, violations) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${location}[${index}]`, violations));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, entry] of Object.entries(value)) {
    const child = location ? `${location}.${key}` : key;
    if (forbiddenField.test(key)) violations.push(`${child}: internal deployment field is forbidden in public repositories`);
    visit(entry, child, violations);
  }
}

export function validateWorkflow(workflow) {
  const violations = [];
  if (workflow?.on?.pull_request_target !== undefined) {
    violations.push("on.pull_request_target: privileged contributor execution is forbidden in public repositories");
  }

  for (const [jobId, job] of Object.entries(workflow?.jobs ?? {})) {
    const runnerLabels = Array.isArray(job?.["runs-on"]) ? job["runs-on"] : job?.["runs-on"] ? [job["runs-on"]] : [];
    for (const label of runnerLabels) {
      if (forbiddenRunnerLabels.has(label)) {
        violations.push(`jobs.${jobId}.runs-on: internal runner label is forbidden in public repositories`);
      } else if (label !== approvedRunner) {
        violations.push(`jobs.${jobId}.runs-on: only ${approvedRunner} is approved for public repositories`);
      }
    }

    if (job?.secrets === "inherit") violations.push(`jobs.${jobId}.secrets: secret inheritance is forbidden in public repositories`);
    if (job?.uses && !job.uses.startsWith("./") && !immutableReference.test(job.uses)) {
      violations.push(`jobs.${jobId}.uses: reusable workflow must use a full commit SHA`);
    }
  }

  visit(workflow, "", violations);
  return [...new Set(violations)];
}

export function validatePublicExecutionBoundary(root = process.cwd()) {
  const directory = path.join(root, ".github", "workflows");
  const files = fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name));
  const violations = [];

  for (const name of files) {
    const workflow = parse(fs.readFileSync(path.join(directory, name), "utf8"));
    for (const violation of validateWorkflow(workflow)) violations.push(`${name}: ${violation}`);
  }
  return {workflows: files.length, violations};
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = validatePublicExecutionBoundary();
  if (result.violations.length) {
    console.error(result.violations.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated public execution boundary across ${result.workflows} workflows.`);
  }
}
