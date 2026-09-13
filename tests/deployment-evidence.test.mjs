import test from "node:test";
import assert from "node:assert/strict";

const input = () => ({
  attemptId: "DPA-20260913-0001",
  repository: "OXY7O/example-app-laravel",
  environment: "development",
  targetId: "laravel-development-container-host",
  sourceSha: "a".repeat(40),
  workflowSha: "b".repeat(40),
  artifactId: "ART-LARAVEL-20260913-0001",
  imageDigest: `sha256:${"c".repeat(64)}`,
  authorizationReference: "ENV-DEVELOPMENT-001",
  startedAt: "2026-09-13T10:00:00.000Z",
  completedAt: "2026-09-13T10:02:00.000Z",
  terminalStatus: "succeeded",
  failureCategory: null,
  healthStatus: "healthy",
  previousLkgDigest: null,
  resultingLkgDigest: `sha256:${"c".repeat(64)}`,
  rollbackStatus: "not-required",
  governanceVersion: "v1.5.0",
  contractDigest: `sha256:${"d".repeat(64)}`
});

test("generates allowlist-only successful deployment evidence", async () => {
  const {generateDeploymentEvidence} = await import("../lib/generate-deployment-evidence.js");
  assert.deepEqual(generateDeploymentEvidence(input()), input());
});

test("supports controlled failure and rollback states", async () => {
  const {generateDeploymentEvidence} = await import("../lib/generate-deployment-evidence.js");
  const result = generateDeploymentEvidence({...input(), terminalStatus: "failed", failureCategory: "health", healthStatus: "unhealthy", rollbackStatus: "succeeded"});
  assert.equal(result.failureCategory, "health");
  assert.equal(result.rollbackStatus, "succeeded");
});

test("rejects secret, network, identity, raw command, and environment values", async () => {
  const {generateDeploymentEvidence} = await import("../lib/generate-deployment-evidence.js");
  for (const unsafe of [{token: "x"}, {privateKey: "x"}, {password: "x"}, {hostname: "10.0.0.8"}, {ip: "10.0.0.8"}, {username: "deploy"}, {command: "docker compose up"}, {environmentValues: {APP_KEY: "x"}}]) {
    assert.throws(() => generateDeploymentEvidence({...input(), ...unsafe}), /additional propert/i);
  }
});

test("rejects invalid state combinations and timestamps", async () => {
  const {generateDeploymentEvidence} = await import("../lib/generate-deployment-evidence.js");
  assert.throws(() => generateDeploymentEvidence({...input(), terminalStatus: "succeeded", failureCategory: "pull"}), /failureCategory/i);
  assert.throws(() => generateDeploymentEvidence({...input(), completedAt: "2026-09-13T09:00:00.000Z"}), /completedAt/i);
});
