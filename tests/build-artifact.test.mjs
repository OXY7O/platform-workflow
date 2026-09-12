import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const base = {
  workingDirectory: "tests/fixtures/artifact-safe", outputDirectory: "tests/tmp/artifacts",
  sourceSha: "a".repeat(40), workflowSha: "b".repeat(40), contractDigest: `sha256:${"c".repeat(64)}`,
  lockDigest: `sha256:${"d".repeat(64)}`, retentionDays: 14
};

test("builds the same package digest from the same source", async () => {
  const {buildArtifact} = await import("../lib/build-artifact.js");
  fs.rmSync(base.outputDirectory, {recursive: true, force: true});
  const first = await buildArtifact(base);
  const second = await buildArtifact(base);
  assert.match(first.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.digest, second.digest);
  assert.equal(first.readiness, "ci-qualified");
  const manifest = JSON.parse(fs.readFileSync(first.manifestPath, "utf8"));
  assert.equal(manifest.governanceVersion, "v1.5.0");
  assert.equal(manifest.catalogueVersion, "1.2.0");
  assert.equal(manifest.files.some((file) => file.path === ".env.example"), false);
  assert.equal(manifest.files.some((file) => file.path.startsWith("tests/")), false);
});

test("rejects an environment file", async () => {
  const {buildArtifact} = await import("../lib/build-artifact.js");
  await assert.rejects(() => buildArtifact({...base, workingDirectory: "tests/fixtures/artifact-with-env"}), /prohibited.*\.env/i);
});

test("rejects private key content under a neutral filename", async () => {
  const {buildArtifact} = await import("../lib/build-artifact.js");
  await assert.rejects(() => buildArtifact({...base, workingDirectory: "tests/fixtures/artifact-with-private-key"}), /private key/i);
});
