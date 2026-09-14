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
  if (/\b(deploy|deployment)\b/i.test(name)) errors.push(`${file}: deployment workflows belong to the private delivery control plane`);
  if (name === "ci-compatibility-php-laravel.yml") {
    const workflow=parse(source); const serialized=JSON.stringify(workflow);
    if (/upload-artifact|build-application-package/i.test(serialized)) errors.push(`${file}: compatibility workflow must be artifactless`);
    if (/"(?:environment|secrets)"\s*:/.test(serialized)) errors.push(`${file}: privileged context is prohibited`);
    if (Object.keys(workflow.on.workflow_call.outputs ?? {}).some(key=>/artifact/i.test(key))) errors.push(`${file}: artifact outputs are prohibited`);
  }
  if (name === "ci-compatibility-go-service.yml") {
    const workflow=parse(source); const serialized=JSON.stringify(workflow);
    if (/upload-artifact|build-go-binary-artifact/i.test(serialized)) errors.push(`${file}: Go compatibility workflow must be artifactless`);
    if (/"(?:environment|secrets)"\s*:/.test(serialized)) errors.push(`${file}: privileged context is prohibited`);
    if (Object.keys(workflow.on.workflow_call.outputs ?? {}).some(key=>/artifact/i.test(key))) errors.push(`${file}: artifact outputs are prohibited`);
  }
  if (name === "ci-compatibility-dotnet-webapi.yml") {
    const workflow=parse(source); const serialized=JSON.stringify(workflow);
    if (/upload-artifact|build-dotnet-application-artifact/i.test(serialized)) errors.push(`${file}: .NET compatibility workflow must be artifactless`);
    if (/"(?:environment|secrets)"\s*:/.test(serialized)) errors.push(`${file}: privileged context is prohibited`);
    if (Object.keys(workflow.on.workflow_call.outputs ?? {}).some(key=>/artifact/i.test(key))) errors.push(`${file}: artifact outputs are prohibited`);
  }
}

for (const file of [
  "scripts/dotnet-family-ci.sh",
  "scripts/dotnet-webapi-ci.sh",
  "actions/dotnet-family-check/action.yml",
  "actions/dotnet-webapi-check/action.yml"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required .NET executor file is missing`);
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
  "contracts/go-binary-artifact-input.schema.json",
  "contracts/go-binary-manifest.schema.json",
  "contracts/dotnet-webapi-input.schema.json",
  "contracts/dotnet-application-artifact-input.schema.json",
  "contracts/dotnet-application-manifest.schema.json",
  "contracts/dotnet-compatibility-input.schema.json",
  "contracts/dotnet-compatibility-catalogue.schema.json",
  "contracts/oci-build-input.schema.json",
  "contracts/public-execution-boundary.schema.json",
  "catalogue/technology-stack.json"
]) JSON.parse(fs.readFileSync(file, "utf8"));

const technologyCatalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
const laravelRuntime = technologyCatalogue.profiles?.["php-laravel"]?.runtimeImageReference;
if (!/^ghcr\.io\/oxy7o\/platform-ci-php@sha256:[a-f0-9]{64}$/.test(laravelRuntime ?? "")) {
  errors.push("catalogue/technology-stack.json: PHP/Laravel runtime must use an approved immutable GHCR digest");
}
for (const [file, job] of [
  [".github/workflows/ci-family-php.yml", "php-family"],
  [".github/workflows/ci-profile-php-laravel.yml", "package"],
]) {
  const workflow = parse(fs.readFileSync(file, "utf8"));
  if (workflow.jobs?.[job]?.container?.image !== laravelRuntime) {
    errors.push(`${file}: ${job} runtime must match the PHP/Laravel catalogue digest`);
  }
}

JSON.parse(fs.readFileSync("catalogue/go-service.json", "utf8"));
JSON.parse(fs.readFileSync("catalogue/dotnet-webapi.json", "utf8"));

for (const file of [
  "src/validate-dotnet-compatibility-contract.ts", "src/action-validate-dotnet-compatibility-contract.ts",
  "actions/validate-dotnet-compatibility-contract/action.yml", "dist/validate-dotnet-compatibility-contract/index.js",
  "src/generate-dotnet-compatibility-matrix.ts", "src/action-generate-dotnet-compatibility-matrix.ts",
  "actions/generate-dotnet-compatibility-matrix/action.yml", "dist/generate-dotnet-compatibility-matrix/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required .NET compatibility file is missing`);
}

for (const file of [
  "src/build-dotnet-application-artifact.ts",
  "src/action-build-dotnet-application-artifact.ts",
  "actions/build-dotnet-application-artifact/action.yml",
  "dist/build-dotnet-application-artifact/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required .NET application artifact file is missing`);
}

for (const file of [
  "src/validate-dotnet-webapi-contract.ts",
  "src/action-validate-dotnet-webapi-contract.ts",
  "actions/validate-dotnet-webapi-contract/action.yml",
  "dist/validate-dotnet-webapi-contract/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required .NET Web API contract file is missing`);
}

for (const file of [
  "src/validate-go-service-contract.ts",
  "src/action-validate-go-service-contract.ts",
  "actions/validate-go-service-contract/action.yml",
  "dist/validate-go-service-contract/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required Go Service contract file is missing`);
}

for (const file of [
  "src/validate-go-compatibility-contract.ts",
  "src/action-validate-go-compatibility-contract.ts",
  "actions/validate-go-compatibility-contract/action.yml",
  "dist/validate-go-compatibility-contract/index.js",
  "src/generate-go-compatibility-matrix.ts",
  "src/action-generate-go-compatibility-matrix.ts",
  "actions/generate-go-compatibility-matrix/action.yml",
  "dist/generate-go-compatibility-matrix/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required Go compatibility file is missing`);
}

for (const file of [
  "src/build-go-binary-artifact.ts",
  "src/action-build-go-binary-artifact.ts",
  "actions/build-go-binary-artifact/action.yml",
  "dist/build-go-binary-artifact/index.js"
]) {
  if (!fs.existsSync(file)) errors.push(`${file}: required Go binary artifact file is missing`);
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
