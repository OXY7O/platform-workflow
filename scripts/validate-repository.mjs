import fs from "node:fs";
import path from "node:path";
import {parse} from "yaml";

const workflowDirectory = ".github/workflows";
const workflowFiles = fs.readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/.test(name));
const errors = [];

for (const name of workflowFiles) {
  const file = path.join(workflowDirectory, name);
  const source = fs.readFileSync(file, "utf8");
  parse(source);

  for (const match of source.matchAll(/^\s*uses:\s*([^\s]+)\s*$/gm)) {
    const reference = match[1];
    if (reference.startsWith("./")) continue;
    if (!/@[a-f0-9]{40}$/.test(reference)) errors.push(`${file}: mutable action reference ${reference}`);
  }

  if (/secrets:\s*inherit/.test(source)) errors.push(`${file}: secrets inheritance is prohibited`);
  if (/\b(deploy|deployment)\b/i.test(name)) errors.push(`${file}: deployment workflow is outside v0.1.0 scope`);
  if (name === "ci-compatibility-php-laravel.yml") {
    const workflow=parse(source); const serialized=JSON.stringify(workflow);
    if (/upload-artifact|build-application-package/i.test(serialized)) errors.push(`${file}: compatibility workflow must be artifactless`);
    if (/"(?:environment|secrets)"\s*:/.test(serialized)) errors.push(`${file}: privileged context is prohibited`);
    if (Object.keys(workflow.on.workflow_call.outputs ?? {}).some(key=>/artifact/i.test(key))) errors.push(`${file}: artifact outputs are prohibited`);
  }
}

for (const file of [
  "contracts/workflow-input.schema.json",
  "contracts/workflow-output.schema.json",
  "contracts/artifact-manifest.schema.json",
  "contracts/failure-taxonomy.json",
  "contracts/artifact-handoff.json",
  "contracts/compatibility-input.schema.json",
  "contracts/compatibility-catalogue.schema.json",
  "contracts/compatibility-output.schema.json",
  "contracts/go-service-input.schema.json",
  "contracts/go-compatibility-input.schema.json",
  "contracts/go-compatibility-catalogue.schema.json",
  "catalogue/technology-stack.json"
]) JSON.parse(fs.readFileSync(file, "utf8"));

for (const file of [
  "src/validate-go-service-contract.ts",
  "src/action-validate-go-service-contract.ts",
  "actions/validate-go-service-contract/action.yml",
  "dist/validate-go-service-contract/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required Go Service contract file is missing`);
}

for (const file of [
  "scripts/go-family-ci.sh",
  "scripts/go-service-ci.sh",
  "actions/go-family-check/action.yml",
  "actions/go-service-check/action.yml"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required Go executor file is missing`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${workflowFiles.length} workflows and governed machine-readable contracts.`);
