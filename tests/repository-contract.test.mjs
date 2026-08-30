import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("declares machine-readable governance and pilot boundary", () => {
  const policy = JSON.parse(fs.readFileSync("repository-policy.json", "utf8"));
  assert.deepEqual(policy, {
    governanceBaseline: "platform-governance@v1.2.0",
    release: "v0.4.1",
    maturity: "pilot",
    capabilities: ["ci", "artifact", "compatibility-matrix"],
    deploymentEnabled: false
  });
});
