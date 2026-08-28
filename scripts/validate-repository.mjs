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
}

for (const file of [
  "contracts/workflow-input.schema.json",
  "contracts/workflow-output.schema.json",
  "contracts/artifact-manifest.schema.json",
  "contracts/failure-taxonomy.json",
  "contracts/artifact-handoff.json",
  "catalogue/technology-stack.json"
]) JSON.parse(fs.readFileSync(file, "utf8"));

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${workflowFiles.length} workflows and governed machine-readable contracts.`);
