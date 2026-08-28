import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

const paths = [".github/workflows/ci-family-php.yml", ".github/workflows/ci-profile-php-laravel.yml"];
const load = (path) => parse(fs.readFileSync(path, "utf8"));

test("both CI workflows expose workflow_call under read-only permission", () => {
  for (const path of paths) {
    const workflow = load(path);
    assert.ok(workflow.on.workflow_call, path);
    assert.deepEqual(workflow.permissions, {contents: "read"});
    assert.equal(Object.keys(workflow.jobs).some((id) => id.includes("deploy")), false);
  }
});

test("Laravel profile exposes governed artifact outputs", () => {
  const workflow = load(paths[1]);
  for (const output of ["readiness", "failure-category", "artifact-id", "artifact-name", "artifact-digest", "manifest-digest", "evidence-metadata"]) {
    assert.ok(workflow.on.workflow_call.outputs[output], output);
  }
});

test("all external actions are pinned to a full commit SHA", () => {
  for (const path of paths) {
    const workflow = load(path);
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        if (!step.uses || step.uses.startsWith("./")) continue;
        assert.match(step.uses, /^[^@]+@[a-f0-9]{40}$/, `${path}: ${step.uses}`);
      }
    }
  }
});
