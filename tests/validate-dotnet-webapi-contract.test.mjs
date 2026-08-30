import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  calculateDotnetWebApiContractDigest,
  validateDotnetWebApiContract,
} from "../lib/validate-dotnet-webapi-contract.js";

const fixture = () => JSON.parse(
  fs.readFileSync("tests/fixtures/contracts/valid-dotnet-webapi.json", "utf8"),
);

test("accepts the governed .NET Web API caller contract", () => {
  const value = validateDotnetWebApiContract(fixture());
  assert.equal(value.profileKey, "dotnet-webapi");
  assert.equal(value.sdkVersion, "10.0.110");
  assert.equal(value.targetFramework, "net10.0");
  assert.equal(value.runtimeIdentifier, "linux-x64");
  assert.match(calculateDotnetWebApiContractDigest(value), /^sha256:[a-f0-9]{64}$/);
});

test("rejects caller-controlled execution and dependency options", () => {
  for (const property of ["command", "msbuildProperties", "nugetSource", "testFilter", "cacheKey"]) {
    assert.throws(
      () => validateDotnetWebApiContract({...fixture(), [property]: "unsafe"}),
      /invalid/i,
      property,
    );
  }
});

test("rejects unsafe source paths", () => {
  for (const property of ["solutionPath", "projectPath", "testProjectPath"]) {
    for (const value of ["../outside", "/tmp/outside", `safe/../../outside`]) {
      assert.throws(
        () => validateDotnetWebApiContract({...fixture(), [property]: value}),
        /invalid/i,
        `${property}: ${value}`,
      );
    }
  }
});

test("rejects unsupported identity, build target, metadata, and bounds", () => {
  const invalidValues = [
    {sdkVersion: "10.0.400"},
    {sdkVersion: "11.0.100-preview.6.26359.118"},
    {targetFramework: "net8.0"},
    {artifactName: "INVALID_name"},
    {applicationVersion: "v1.0.0"},
    {runtimeIdentifier: "linux-arm64"},
    {publishMode: "self-contained"},
    {coverageThreshold: -1},
    {coverageThreshold: 101},
    {retentionDays: 0},
    {retentionDays: 31},
    {extensions: ["arbitrary-command"]},
  ];

  for (const change of invalidValues) {
    assert.throws(
      () => validateDotnetWebApiContract({...fixture(), ...change}),
      /invalid/i,
      JSON.stringify(change),
    );
  }
});

test("contract digest is independent of object key order", () => {
  const input = fixture();
  const reversed = Object.fromEntries(Object.entries(input).reverse());
  assert.equal(
    calculateDotnetWebApiContractDigest(input),
    calculateDotnetWebApiContractDigest(reversed),
  );
});
