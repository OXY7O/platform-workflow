import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {parse} from "yaml";

const file = ".github/workflows/ci-compatibility-go-service.yml";

test("Go compatibility workflow is read-only and artifactless", () => {
  const source = fs.readFileSync(file, "utf8");
  const workflow = parse(source);
  assert.deepEqual(workflow.permissions, {contents: "read"});
  assert.ok(workflow.on.workflow_call);
  assert.doesNotMatch(source, /upload-artifact|build-go-binary-artifact|\benvironment\s*:|secrets\s*:|\bdeploy(?:ment)?\b/i);
  assert.equal(Object.keys(workflow.on.workflow_call.outputs).some((key) => /artifact/i.test(key)), false);
});

test("Go compatibility workflow exposes safe outputs and immutable actions", () => {
  const source = fs.readFileSync(file, "utf8");
  const workflow = parse(source);
  for (const step of workflow.jobs.compatibility.steps) {
    if (step.uses && !step.uses.startsWith("./")) assert.match(step.uses, /@[a-f0-9]{40}$/);
  }
  for (const key of ["readiness", "failure-category", "contract-digest", "module-digest", "evidence-metadata"]) {
    assert.ok(workflow.on.workflow_call.outputs[key]);
  }
});
