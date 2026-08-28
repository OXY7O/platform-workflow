import test from "node:test";
import assert from "node:assert/strict";

const safe = {
  schemaVersion: "1.0", governanceVersion: "v1.1.0", catalogueVersion: "1.1.0",
  profileKey: "php-laravel", sourceSha: "a".repeat(40), workflowSha: "b".repeat(40),
  contractDigest: `sha256:${"c".repeat(64)}`, runnerClass: "linux-x64",
  runnerImage: "ubuntu-24.04", checks: [], artifact: null, evidenceReference: null
};

test("returns a detached safe evidence record", async () => {
  const {generateEvidence} = await import("../lib/generate-evidence.js");
  const result = generateEvidence(safe);
  result.runnerClass = "changed";
  assert.equal(safe.runnerClass, "linux-x64");
});

test("rejects unsafe keys recursively", async () => {
  const {generateEvidence} = await import("../lib/generate-evidence.js");
  assert.throws(() => generateEvidence({...safe, nested: {token: "hidden"}}), /unsafe evidence/i);
});

test("rejects private key material under a neutral key", async () => {
  const {generateEvidence} = await import("../lib/generate-evidence.js");
  assert.throws(() => generateEvidence({...safe, runnerImage: "-----BEGIN PRIVATE KEY-----"}), /unsafe evidence/i);
});
