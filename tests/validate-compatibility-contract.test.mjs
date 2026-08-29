import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {calculateCompatibilityContractDigest, validateCompatibilityContract} from "../lib/validate-compatibility-contract.js";

const fixture = () => JSON.parse(fs.readFileSync("tests/fixtures/contracts/valid-php-laravel-compatibility.json", "utf8"));

test("accepts a controlled compatibility lane", () => {
  const value = validateCompatibilityContract(fixture());
  assert.equal(value.laneId, "laravel-12-php-8.2");
  assert.match(calculateCompatibilityContractDigest(value), /^sha256:[a-f0-9]{64}$/);
});

test("rejects caller commands and path traversal", () => {
  assert.throws(() => validateCompatibilityContract({...fixture(), command: "composer update"}), /invalid/i);
  assert.throws(() => validateCompatibilityContract({...fixture(), workingDirectory: "../outside"}), /invalid/i);
});

test("digest is independent of object key order", () => {
  const input = fixture();
  assert.equal(calculateCompatibilityContractDigest(input), calculateCompatibilityContractDigest(Object.fromEntries(Object.entries(input).reverse())));
});
