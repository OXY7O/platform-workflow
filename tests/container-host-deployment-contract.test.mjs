import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const fixture = () => JSON.parse(fs.readFileSync("tests/fixtures/deployment/valid-development.json", "utf8"));

test("accepts the governed development container-host contract", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  const result = validateContainerHostDeployment(fixture());
  assert.equal(result.environment, "development");
  assert.equal(result.targetId, "laravel-development-container-host");
});

test("accepts an immutable LKG digest", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  const lkgImageDigest = `sha256:${"d".repeat(64)}`;
  assert.equal(validateContainerHostDeployment({...fixture(), lkgImageDigest}).lkgImageDigest, lkgImageDigest);
});

test("returns a stable deployment contract digest", async () => {
  const {calculateContainerHostDeploymentDigest} = await import("../lib/validate-container-host-deployment.js");
  const input = fixture();
  assert.equal(calculateContainerHostDeploymentDigest(input), calculateContainerHostDeploymentDigest(Object.fromEntries(Object.entries(input).reverse())));
});

test("rejects mutable or contradictory image identity", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  assert.throws(() => validateContainerHostDeployment({...fixture(), imageReference: "ghcr.io/oxy7o/example-app-laravel:latest"}), /imageReference/i);
  assert.throws(() => validateContainerHostDeployment({...fixture(), imageDigest: `sha256:${"d".repeat(64)}`}), /imageReference.*imageDigest/i);
});

test("rejects network, credential, and command fields", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  for (const field of [
    {hostname: "10.0.0.8"},
    {username: "deploy"},
    {password: "secret"},
    {command: "docker compose up"}
  ]) {
    assert.throws(() => validateContainerHostDeployment({...fixture(), ...field}), /additional propert/i);
  }
});

test("rejects unsafe compose paths and services", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  for (const composePath of ["/srv/compose.yaml", "../compose.yaml"]) {
    assert.throws(() => validateContainerHostDeployment({...fixture(), composePath}), /composePath/i);
  }
  assert.throws(() => validateContainerHostDeployment({...fixture(), services: ["database"]}), /services/i);
});

test("rejects cross-environment target and unsupported environment", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  assert.throws(() => validateContainerHostDeployment({...fixture(), targetId: "laravel-production-container-host"}), /targetId/i);
  assert.throws(() => validateContainerHostDeployment({...fixture(), environment: "production"}), /environment/i);
});

test("enforces bounded health policy", async () => {
  const {validateContainerHostDeployment} = await import("../lib/validate-container-host-deployment.js");
  assert.throws(() => validateContainerHostDeployment({...fixture(), healthPath: "/admin"}), /healthPath/i);
  assert.throws(() => validateContainerHostDeployment({...fixture(), healthTimeoutSeconds: 301}), /healthTimeoutSeconds/i);
  assert.throws(() => validateContainerHostDeployment({...fixture(), healthRetries: 0}), /healthRetries/i);
});
