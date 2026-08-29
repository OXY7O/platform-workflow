import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {parse} from "yaml";

const env = {
  ...process.env,
  PATH: `${path.resolve("tests/fixtures/bin")}:${process.env.PATH}`,
  RUNNER_TEMP: path.resolve("tests/tmp/go-executor"),
};

const run = (script, args) => spawnSync("bash", [script, ...args], {
  encoding: "utf8",
  env,
});

test("Go family accepts a controlled valid fixture", () => {
  const result = run("scripts/go-family-ci.sh", [
    "tests/fixtures/go-service-valid", "1.26.7", "80",
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"id":"go-family".*"status":"passed"/);
});

test("Go family rejects a missing module checksum", () => {
  const result = run("scripts/go-family-ci.sh", [
    "tests/fixtures/go-missing-sum", "1.26.7", "80",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"dependency"/);
});

test("Go family classifies unformatted source as quality failure", () => {
  const result = run("scripts/go-family-ci.sh", [
    "tests/fixtures/go-format-failure", "1.26.7", "80",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"quality"/);
});

test("Go Service builds only a controlled main package", () => {
  const output = "tests/tmp/go-executor/example-api";
  const result = run("scripts/go-service-ci.sh", [
    "tests/fixtures/go-service-valid", "./", output,
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.statSync(output).mode & 0o111, 0o111);

  const invalid = run("scripts/go-service-ci.sh", [
    "tests/fixtures/go-service-valid", "./; touch unsafe", output,
  ]);
  assert.equal(invalid.status, 2);
  assert.match(invalid.stdout, /"failureCategory":"contract"/);
});

test("Go actions expose typed inputs without arbitrary commands", () => {
  for (const file of [
    "actions/go-family-check/action.yml",
    "actions/go-service-check/action.yml",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    const action = parse(source);
    assert.equal("command" in (action.inputs ?? {}), false);
    assert.doesNotMatch(source, /\beval\b/);
  }
});
