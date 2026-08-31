import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const env = {...process.env, PATH: `${path.resolve("tests/fixtures/bin")}:${process.env.PATH}`, RUNNER_TEMP: path.resolve("tests/tmp")};

function run(script, args) {
  return spawnSync("bash", [script, ...args], {encoding: "utf8", env});
}

function runWithEnv(script, args, extraEnv) {
  return spawnSync("bash", [script, ...args], {
    encoding: "utf8",
    env: {...env, ...extraEnv},
  });
}

test("shell executors declare their shared library for static analysis", () => {
  for (const file of ["scripts/php-family-ci.sh", "scripts/laravel-profile-ci.sh"]) {
    assert.match(fs.readFileSync(file, "utf8"), /# shellcheck source=scripts\/lib\/result\.sh/);
  }
});

test("PHP family preflight rejects missing composer lock", () => {
  const result = run("scripts/php-family-ci.sh", ["tests/fixtures/laravel-missing-lock", "composer-frozen"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"dependency"/);
});

test("PHP family emits every implemented baseline check", () => {
  const result = run("scripts/php-family-ci.sh", ["tests/fixtures/laravel-valid", "composer-frozen"]);
  assert.equal(result.status, 0, result.stderr);
  for (const check of ["php-syntax", "composer-lock", "dependency-audit", "sensitive-material-guard"]) {
    assert.match(result.stdout, new RegExp(`"id":"${check}".*"status":"passed"`), check);
  }
});

test("PHP family classifies dependency audit failure", () => {
  const result = runWithEnv(
    "scripts/php-family-ci.sh",
    ["tests/fixtures/laravel-valid", "composer-frozen"],
    {COMPOSER_FAKE_AUDIT_FAILURE: "1"},
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"id":"dependency-audit".*"failureCategory":"security"/);
});

test("PHP family classifies syntax failure as a quality failure", () => {
  const result = runWithEnv(
    "scripts/php-family-ci.sh",
    ["tests/fixtures/laravel-valid", "composer-frozen"],
    {PHP_FAKE_LINT_FAILURE: "1"},
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"id":"php-syntax".*"failureCategory":"quality"/);
});

test("PHP family rejects sensitive material before dependency execution", () => {
  const result = run("scripts/php-family-ci.sh", ["tests/fixtures/laravel-sensitive", "composer-frozen"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"id":"sensitive-material-guard".*"failureCategory":"security"/);
});

test("Laravel executor classifies a failing test preset", () => {
  const result = run("scripts/laravel-profile-ci.sh", ["tests/fixtures/laravel-test-failure", "phpunit"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"test"/);
});

test("Laravel executor rejects a caller command instead of evaluating it", () => {
  const result = run("scripts/laravel-profile-ci.sh", ["tests/fixtures/laravel-valid", "phpunit; touch unsafe"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout.includes("unknown test preset"), true);
});
