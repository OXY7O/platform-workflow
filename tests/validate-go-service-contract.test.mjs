import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  calculateGoServiceContractDigest,
  validateGoServiceContract,
} from "../lib/validate-go-service-contract.js";

const fixture = () => JSON.parse(
  fs.readFileSync("tests/fixtures/contracts/valid-go-service.json", "utf8"),
);

test("accepts the governed Go Service contract", () => {
  const value = validateGoServiceContract(fixture());
  assert.equal(value.profileKey, "go-service");
  assert.equal(value.goVersion, "1.26.7");
  assert.equal(value.binaryName, "example-api");
  assert.match(calculateGoServiceContractDigest(value), /^sha256:[a-f0-9]{64}$/);
});

test("rejects caller commands and unsafe paths", () => {
  assert.throws(
    () => validateGoServiceContract({...fixture(), command: "go test ./..."}),
    /invalid/i,
  );
  for (const workingDirectory of ["../outside", "/tmp/source"]) {
    assert.throws(
      () => validateGoServiceContract({...fixture(), workingDirectory}),
      /invalid/i,
    );
  }
});

test("rejects unsupported identity, version, target, and numeric bounds", () => {
  const invalidValues = [
    {binaryName: "INVALID_name"},
    {goVersion: "1.25.0"},
    {goVersion: "1.27.0"},
    {targetOs: "windows"},
    {targetArch: "arm64"},
    {retentionDays: 0},
    {retentionDays: 31},
    {coverageThreshold: -1},
    {coverageThreshold: 101},
  ];

  for (const change of invalidValues) {
    assert.throws(
      () => validateGoServiceContract({...fixture(), ...change}),
      /invalid/i,
      JSON.stringify(change),
    );
  }
});

test("contract digest is independent of object key order", () => {
  const input = fixture();
  const reversed = Object.fromEntries(Object.entries(input).reverse());
  assert.equal(
    calculateGoServiceContractDigest(input),
    calculateGoServiceContractDigest(reversed),
  );
});
