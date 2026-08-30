import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {parse} from "yaml";

const familyFile = ".github/workflows/ci-family-go.yml";
const profileFile = ".github/workflows/ci-profile-go-service.yml";

test("Go family and profile workflows are callable and read-only", () => {
  for (const file of [familyFile, profileFile]) {
    const workflow = parse(fs.readFileSync(file, "utf8"));
    assert.ok(workflow.on.workflow_call);
    assert.deepEqual(workflow.permissions, {contents: "read"});
  }
});

test("Go profile creates exactly one canonical artifact and requires compatibility", () => {
  const source = fs.readFileSync(profileFile, "utf8");
  const workflow = parse(source);
  const serialized = JSON.stringify(workflow);

  assert.equal((source.match(/actions\/upload-artifact@/g) ?? []).length, 1);
  assert.match(serialized, /1\.26\.7/);
  assert.match(serialized, /ci-compatibility-go-service\.yml/);
  assert.match(serialized, /generate-go-compatibility-matrix/);
  assert.doesNotMatch(source, /\benvironment\s*:|secrets\s*:|\bdeploy(?:ment)?\b/i);
  assert.equal(workflow.jobs.compatibility.needs.includes("prepare-compatibility"), true);
});

test("Go profile exposes canonical artifact and safe evidence outputs", () => {
  const workflow = parse(fs.readFileSync(profileFile, "utf8"));
  for (const key of [
    "readiness", "failure-category", "artifact-id", "artifact-name",
    "artifact-digest", "manifest-digest", "evidence-metadata",
  ]) {
    assert.ok(workflow.on.workflow_call.outputs[key]);
  }
});

test("all Go workflow external references are immutable", () => {
  for (const file of [familyFile, profileFile, ".github/workflows/ci-compatibility-go-service.yml"]) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/^\s*uses:\s*([^\s]+)\s*$/gm)) {
      const reference = match[1];
      if (reference.startsWith("./")) continue;
      assert.match(reference, /@[a-f0-9]{40}$/, `${file}: ${reference}`);
    }
  }
});
