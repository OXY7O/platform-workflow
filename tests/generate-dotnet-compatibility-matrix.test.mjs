import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {generateDotnetCompatibilityMatrix} from "../lib/generate-dotnet-compatibility-matrix.js";

const fixture = () => JSON.parse(fs.readFileSync("catalogue/dotnet-webapi.json", "utf8"));

test(".NET preview compatibility is opt-in, non-blocking, and artifactless", () => {
  assert.deepEqual(generateDotnetCompatibilityMatrix(fixture(), {includePreview: false}), {include: []});
  assert.deepEqual(generateDotnetCompatibilityMatrix(fixture(), {includePreview: true}), {include: [{
    laneId: "dotnet-sdk-11.0.100-preview.6.26359.118-net10.0-linux-x64",
    sdkVersion: "11.0.100-preview.6.26359.118", targetFramework: "net10.0",
    runtimeIdentifier: "linux-x64", solutionPath: "Example.App.Dotnet.slnx",
    projectPath: "src/Example.Api/Example.Api.csproj",
    testProjectPath: "tests/Example.Api.Tests/Example.Api.Tests.csproj",
    coverageThreshold: 80, executionMode: "compatibility-only", lifecycle: "preview",
    blocking: false, artifact: false,
  }]});
});

test("rejects duplicate, contradictory, blocking, artifact, and canonical compatibility lanes", () => {
  const duplicate = fixture(); duplicate.lanes.push({...duplicate.lanes[1]});
  assert.throws(() => generateDotnetCompatibilityMatrix(duplicate, {includePreview: true}), /duplicate/i);
  for (const change of [
    {laneId: "dotnet-sdk-11.0.100-preview.6.26359.118-net8.0-linux-x64"},
    {blocking: true}, {artifact: true}, {executionMode: "canonical-artifact"},
  ]) {
    const value = fixture(); Object.assign(value.lanes[1], change);
    assert.throws(() => generateDotnetCompatibilityMatrix(value, {includePreview: true}), /invalid|identity|non-blocking|artifactless|compatibility/i, JSON.stringify(change));
  }
});

test("matrix action enforces relative realpath containment", () => {
  const source = fs.readFileSync("src/action-generate-dotnet-compatibility-matrix.ts", "utf8");
  assert.match(source, /path\.isAbsolute/);
  assert.match(source, /realpathSync/);
  assert.match(source, /must remain within repository/);
});
