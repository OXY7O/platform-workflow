import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import path from "node:path";

const env = {...process.env, PATH: `${path.resolve("tests/fixtures/bin")}:${process.env.PATH}`, RUNNER_TEMP: path.resolve("tests/tmp")};

function run(script, args) {
  return spawnSync("bash", [script, ...args], {encoding: "utf8", env});
}

test("PHP family preflight rejects missing composer lock", () => {
  const result = run("scripts/php-family-ci.sh", ["tests/fixtures/laravel-missing-lock", "composer-frozen"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"dependency"/);
});

test("Laravel executor classifies a failing test preset", () => {
  const result = run("scripts/laravel-profile-ci.sh", ["tests/fixtures/laravel-test-failure", "phpunit", "80"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /"failureCategory":"test"/);
});

test("Laravel executor rejects a caller command instead of evaluating it", () => {
  const result = run("scripts/laravel-profile-ci.sh", ["tests/fixtures/laravel-valid", "phpunit; touch unsafe", "80"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout.includes("unknown test preset"), true);
});
