import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import test from "node:test";
import {buildDotnetApplicationArtifact} from "../lib/build-dotnet-application-artifact.js";

const outputDirectory = path.resolve("tests/tmp/dotnet-application-artifacts");
process.env.RUNNER_TEMP = path.resolve("tests/tmp");
const base = {
  publishDirectory: path.resolve("tests/fixtures/dotnet-publish-safe"),
  outputDirectory,
  artifactName: "example-api",
  applicationVersion: "0.1.0",
  sourceSha: "a".repeat(40),
  workflowSha: "b".repeat(40),
  contractDigest: `sha256:${"c".repeat(64)}`,
  dependencyDigest: `sha256:${"d".repeat(64)}`,
  sdkVersion: "10.0.110",
  targetFramework: "net10.0",
  runtimeIdentifier: "linux-x64",
  publishMode: "framework-dependent",
  retentionDays: 14,
};

function tarEntries(archivePath) {
  const tar = gunzipSync(fs.readFileSync(archivePath));
  const entries = [];
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const mode = header.subarray(100, 108).toString("ascii").replace(/\0.*$/, "").trim();
    const uid = header.subarray(108, 116).toString("ascii").replace(/\0.*$/, "").trim();
    const gid = header.subarray(116, 124).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim() || "0", 8);
    const mtime = header.subarray(136, 148).toString("ascii").replace(/\0.*$/, "").trim();
    entries.push({name, mode, uid, gid, mtime});
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

test("builds a deterministic .NET application archive and manifest", async () => {
  fs.rmSync(outputDirectory, {recursive: true, force: true});
  const first = await buildDotnetApplicationArtifact(base);
  const second = await buildDotnetApplicationArtifact(base);
  assert.equal(first.artifactName, "example-api_0.1.0_net10.0_linux-x64.tar.gz");
  assert.equal(first.digest, second.digest);
  assert.equal(first.manifestDigest, second.manifestDigest);
  assert.equal(first.readiness, "ci-qualified");
  const entries = tarEntries(first.artifactPath);
  assert.deepEqual(entries.map(({name}) => name), [
    "Example.Api", "Example.Api.deps.json", "Example.Api.dll", "manifest.json",
  ]);
  for (const entry of entries) {
    assert.equal(entry.uid, "0000000");
    assert.equal(entry.gid, "0000000");
    assert.equal(entry.mtime, "00000000000");
    assert.ok(["0000644", "0000755"].includes(entry.mode));
  }
  const manifest = JSON.parse(fs.readFileSync(first.manifestPath, "utf8"));
  assert.equal(manifest.sdkVersion, "10.0.110");
  assert.equal(manifest.publishMode, "framework-dependent");
  assert.equal(manifest.files.length, 3);
});

test("rejects unsafe publish content and metadata", async () => {
  const unsafeRoot = path.resolve("tests/tmp/dotnet-publish-unsafe");
  fs.rmSync(unsafeRoot, {recursive: true, force: true});
  fs.mkdirSync(unsafeRoot, {recursive: true});
  const cases = [
    [".env", "TOKEN=secret\n"],
    ["neutral", "-----BEGIN PRIVATE KEY-----\n"],
    ["Source.cs", "class Source {}"],
    ["coverage.cobertura.xml", "<coverage />"],
    ["libcoreclr.so", "runtime"],
  ];
  for (const [name, content] of cases) {
    fs.rmSync(unsafeRoot, {recursive: true, force: true}); fs.mkdirSync(unsafeRoot, {recursive: true});
    fs.writeFileSync(path.join(unsafeRoot, name), content);
    await assert.rejects(() => buildDotnetApplicationArtifact({...base, publishDirectory: unsafeRoot}), /prohibited|invalid|private key/i, name);
  }
  fs.writeFileSync(path.join(unsafeRoot, "safe.dll"), "safe");
  fs.symlinkSync("safe.dll", path.join(unsafeRoot, "linked.dll"));
  await assert.rejects(() => buildDotnetApplicationArtifact({...base, publishDirectory: unsafeRoot}), /symbolic/i);

  for (const change of [
    {sourceSha: "invalid"}, {applicationVersion: "v1.0.0"},
    {runtimeIdentifier: "linux-arm64"}, {targetFramework: "net8.0"},
    {publishMode: "self-contained"}, {outputDirectory: "/private/tmp/outside-artifact"},
  ]) {
    await assert.rejects(() => buildDotnetApplicationArtifact({...base, ...change}), /invalid|output/i, JSON.stringify(change));
  }
});
