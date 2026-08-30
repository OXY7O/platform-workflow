import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {parse} from "yaml";

const temporaryRoot = path.resolve("tests/tmp/dotnet-executor");
const commandLog = path.join(temporaryRoot, "commands.jsonl");

const run = (script, args, overrides = {}) => {
  fs.rmSync(temporaryRoot, {recursive: true, force: true});
  fs.mkdirSync(temporaryRoot, {recursive: true});
  return spawnSync("bash", [script, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${path.resolve("tests/fixtures/bin")}:${process.env.PATH}`,
      RUNNER_TEMP: temporaryRoot,
      DOTNET_FAKE_LOG: commandLog,
      ...overrides,
    },
  });
};

const commands = () => fs.readFileSync(commandLog, "utf8")
  .trim().split("\n").filter(Boolean).map(JSON.parse);

test(".NET family executes the governed checks in order", () => {
  const result = run("scripts/dotnet-family-ci.sh", [
    "tests/fixtures/dotnet-webapi-valid/Example.App.Dotnet.slnx",
    "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj",
    "tests/fixtures/dotnet-webapi-valid/tests/Example.Api.Tests/Example.Api.Tests.csproj",
    "10.0.110", "80",
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"id":"dotnet-family".*"status":"passed"/);
  assert.deepEqual(commands().map((entry) => entry.args.slice(0, 3)), [
    ["--version"],
    ["restore", "tests/fixtures/dotnet-webapi-valid/Example.App.Dotnet.slnx", "--locked-mode"],
    ["format", "tests/fixtures/dotnet-webapi-valid/Example.App.Dotnet.slnx", "--verify-no-changes"],
    ["build", "tests/fixtures/dotnet-webapi-valid/Example.App.Dotnet.slnx", "--configuration"],
    ["test", "tests/fixtures/dotnet-webapi-valid/tests/Example.Api.Tests/Example.Api.Tests.csproj", "--configuration"],
    ["package", "list", "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj"],
    ["package", "list", "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj"],
  ]);
});

test(".NET family classifies lock and format failures", () => {
  const missing = run("scripts/dotnet-family-ci.sh", [
    "tests/fixtures/dotnet-missing-lock/Example.App.Dotnet.slnx",
    "tests/fixtures/dotnet-missing-lock/src/Example.Api/Example.Api.csproj",
    "tests/fixtures/dotnet-missing-lock/tests/Example.Api.Tests/Example.Api.Tests.csproj",
    "10.0.110", "80",
  ]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stdout, /"failureCategory":"dependency"/);

  const format = run("scripts/dotnet-family-ci.sh", [
    "tests/fixtures/dotnet-format-failure/Example.App.Dotnet.slnx",
    "tests/fixtures/dotnet-format-failure/src/Example.Api/Example.Api.csproj",
    "tests/fixtures/dotnet-format-failure/tests/Example.Api.Tests/Example.Api.Tests.csproj",
    "10.0.110", "80",
  ], {DOTNET_FAKE_FAIL: "format"});
  assert.notEqual(format.status, 0);
  assert.match(format.stdout, /"failureCategory":"quality"/);
});

test(".NET Web API validates target and publishes framework-dependent output", () => {
  const output = path.join(temporaryRoot, "publish");
  const valid = run("scripts/dotnet-webapi-ci.sh", [
    "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj",
    "net10.0", "linux-x64", output,
  ]);
  assert.equal(valid.status, 0, valid.stderr || valid.stdout);
  assert.equal(fs.existsSync(path.join(output, "Example.Api.dll")), true);
  assert.deepEqual(commands().at(-1).args, [
    "publish", "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj",
    "--configuration", "Release", "--no-build", "--no-restore",
    "--framework", "net10.0", "--runtime", "linux-x64",
    "--self-contained", "false", "--output", output,
  ]);

  const wrongTarget = run("scripts/dotnet-webapi-ci.sh", [
    "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj",
    "net8.0", "linux-x64", output,
  ]);
  assert.notEqual(wrongTarget.status, 0);
  assert.match(wrongTarget.stdout, /"failureCategory":"configuration"/);

  const outside = run("scripts/dotnet-webapi-ci.sh", [
    "tests/fixtures/dotnet-webapi-valid/src/Example.Api/Example.Api.csproj",
    "net10.0", "linux-x64", "/private/tmp/outside-dotnet-publish",
  ]);
  assert.equal(outside.status, 2);
  assert.match(outside.stdout, /"failureCategory":"contract"/);
});

test(".NET actions expose typed inputs without arbitrary execution", () => {
  for (const file of ["actions/dotnet-family-check/action.yml", "actions/dotnet-webapi-check/action.yml"]) {
    const source = fs.readFileSync(file, "utf8");
    const action = parse(source);
    for (const forbidden of ["command", "msbuild-properties", "nuget-source", "test-filter", "cache-key"]) {
      assert.equal(forbidden in (action.inputs ?? {}), false);
    }
    assert.doesNotMatch(source, /\beval\b/);
  }
  for (const file of ["scripts/dotnet-family-ci.sh", "scripts/dotnet-webapi-ci.sh"]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\beval\b/);
  }
});
