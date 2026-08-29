import assert from "node:assert/strict";
import fs from "node:fs";
import {gunzipSync} from "node:zlib";
import test from "node:test";
import {buildGoBinaryArtifact} from "../lib/build-go-binary-artifact.js";

const outputDirectory = "tests/tmp/go-binary-artifacts";
const base = {
  binaryPath: "tests/fixtures/go-binary-safe/example-api",
  outputDirectory,
  binaryName: "example-api",
  applicationVersion: "0.1.0",
  sourceSha: "a".repeat(40),
  workflowSha: "b".repeat(40),
  contractDigest: `sha256:${"c".repeat(64)}`,
  moduleDigest: `sha256:${"d".repeat(64)}`,
  goVersion: "1.26.7",
  targetOs: "linux",
  targetArch: "amd64",
  retentionDays: 14,
};

function tarEntries(archivePath) {
  const tar = gunzipSync(fs.readFileSync(archivePath));
  const names = [];
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const sizeText = header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    names.push(name);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return names;
}

test("builds a deterministic Go binary archive and manifest", async () => {
  fs.rmSync(outputDirectory, {recursive: true, force: true});
  const first = await buildGoBinaryArtifact(base);
  const second = await buildGoBinaryArtifact(base);

  assert.equal(first.artifactName, "example-api_0.1.0_linux_amd64.tar.gz");
  assert.equal(first.digest, second.digest);
  assert.equal(first.manifestDigest, second.manifestDigest);
  assert.equal(first.readiness, "ci-qualified");
  assert.deepEqual(tarEntries(first.artifactPath), [
    "example-api",
    "manifest.json",
  ]);

  const manifest = JSON.parse(fs.readFileSync(first.manifestPath, "utf8"));
  assert.equal(manifest.goVersion, "1.26.7");
  assert.equal(manifest.target, "linux/amd64");
  assert.equal(manifest.files.length, 1);
  assert.match(manifest.files[0].sha256, /^[a-f0-9]{64}$/);
});

test("rejects unsafe binary inputs and metadata", async () => {
  const unsafeRoot = "tests/tmp/go-binary-unsafe";
  fs.rmSync(unsafeRoot, {recursive: true, force: true});
  fs.mkdirSync(unsafeRoot, {recursive: true});
  fs.writeFileSync(`${unsafeRoot}/.env`, "TOKEN=secret\n", {mode: 0o755});
  fs.writeFileSync(`${unsafeRoot}/neutral`, "-----BEGIN PRIVATE KEY-----\n", {mode: 0o755});
  fs.symlinkSync("neutral", `${unsafeRoot}/linked`);

  for (const change of [
    {binaryPath: `${unsafeRoot}/.env`},
    {binaryPath: `${unsafeRoot}/neutral`},
    {binaryPath: `${unsafeRoot}/linked`},
    {sourceSha: "invalid"},
    {applicationVersion: "version-one"},
    {targetArch: "arm64"},
  ]) {
    await assert.rejects(
      () => buildGoBinaryArtifact({...base, ...change}),
      /invalid|prohibited|private key|symbolic/i,
      JSON.stringify(change),
    );
  }
});
