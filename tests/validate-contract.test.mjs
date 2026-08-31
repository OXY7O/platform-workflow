import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const validInput = JSON.parse(fs.readFileSync("tests/fixtures/contracts/valid-php-laravel.json", "utf8"));

test("accepts the governed Laravel caller contract", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.equal(validateCaller(validInput).profileKey, "php-laravel");
});

test("rejects caller-controlled commands", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.throws(() => validateCaller({...validInput, command: "rm"}), /additional propert/i);
});

test("rejects extensions outside the profile allowlist", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.throws(() => validateCaller({...validInput, extensions: ["unknown"]}), /extension/i);
});

test("rejects declared extensions until an executor is available", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.throws(
    () => validateCaller({...validInput, extensions: ["integration-test"]}),
    /extension/i,
  );
});

test("rejects coverage claims until an enforcement executor is available", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.throws(() => validateCaller({...validInput, coverageThreshold: 80}), /additional propert/i);
});

test("rejects working-directory traversal", async () => {
  const {validateCaller} = await import("../lib/validate-contract.js");
  assert.throws(() => validateCaller({...validInput, workingDirectory: "../escape"}), /workingDirectory/i);
});

test("contract digest is stable regardless of object key order", async () => {
  const {calculateContractDigest} = await import("../lib/validate-contract.js");
  const reversed = Object.fromEntries(Object.entries(validInput).reverse());
  assert.equal(calculateContractDigest(validInput), calculateContractDigest(reversed));
});
