import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {parse} from "yaml";

const files = [
  ".github/workflows/ci-family-dotnet.yml",
  ".github/workflows/ci-compatibility-dotnet-webapi.yml",
  ".github/workflows/ci-profile-dotnet-webapi.yml",
];

test(".NET reusable workflows are callable, read-only, and immutable", () => {
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8"); const workflow = parse(source);
    assert.ok(workflow.on.workflow_call); assert.deepEqual(workflow.permissions, {contents: "read"});
    for (const match of source.matchAll(/^\s*uses:\s*([^\s]+)\s*$/gm)) {
      if (match[1].startsWith("./")) continue;
      assert.match(match[1], /@[a-f0-9]{40}$/, `${file}: ${match[1]}`);
    }
    assert.doesNotMatch(source, /\benvironment\s*:|secrets\s*:\s*inherit|id-token\s*:\s*write|\bdeploy(?:ment)?\b/i);
  }
});

test("canonical .NET profile uploads exactly one qualified artifact", () => {
  const source = fs.readFileSync(files[2], "utf8"); const workflow = parse(source); const serialized = JSON.stringify(workflow);
  assert.equal((source.match(/actions\/upload-artifact@/g) ?? []).length, 1);
  assert.match(serialized, /10\.0\.110/); assert.match(serialized, /net10\.0/); assert.match(serialized, /linux-x64/);
  assert.match(serialized, /build-dotnet-application-artifact/); assert.match(serialized, /ci-compatibility-dotnet-webapi\.yml/);
  for (const key of ["readiness", "failure-category", "artifact-id", "artifact-name", "artifact-digest", "manifest-digest", "evidence-metadata", "preview-result"]) assert.ok(workflow.on.workflow_call.outputs[key]);
});

test("preview workflow is exact, non-blocking, and artifactless", () => {
  const source = fs.readFileSync(files[1], "utf8"); const workflow = parse(source); const serialized = JSON.stringify(workflow);
  assert.match(serialized, /11\.0\.100-preview\.6\.26359\.118/);
  assert.doesNotMatch(serialized, /upload-artifact|build-dotnet-application-artifact/);
  assert.equal(Object.keys(workflow.on.workflow_call.outputs).some((key) => /artifact/i.test(key)), false);
  assert.equal(workflow.jobs.compatibility["continue-on-error"], undefined);
  assert.equal(workflow.jobs.compatibility.steps.find((step) => step.id === "family")["continue-on-error"], true);
  assert.equal(workflow.jobs.compatibility.steps.find((step) => step.id === "profile")["continue-on-error"], true);
  assert.match(serialized, /10\.0\.110/);
  assert.match(serialized, /global\.json/);
  const profile = parse(fs.readFileSync(files[2], "utf8"));
  assert.match(JSON.stringify(profile.jobs["prepare-compatibility"]), /include-preview/);
});
