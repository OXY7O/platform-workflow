import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const matrix = JSON.parse(
  fs.readFileSync("catalogue/governance-traceability.json", "utf8"),
);

test("Laravel CI traceability separates implementation, verification, and compliance", () => {
  assert.equal(matrix.governanceBaseline, "platform-governance@v1.5.1");
  assert.equal(matrix.scope, "php-laravel-ci");
  assert.ok(matrix.records.length >= 10);

  for (const record of matrix.records) {
    assert.match(record.capabilityId, /^CAP-P(?:06|07|09|10|15|16)-/);
    assert.ok(record.controlReferences.length > 0, record.capabilityId);
    assert.ok(record.implementationStatus);
    assert.ok(record.verificationStatus);
    assert.equal(record.complianceStatus, "not-assessed");
  }
});

test("declared required Laravel checks have executable traceability records", async () => {
  const {loadProfile} = await import("../lib/load-profile.js");
  const profile = loadProfile("php-laravel");
  const implementedChecks = new Set(
    matrix.records
      .filter((record) => record.implementationStatus === "implemented")
      .flatMap((record) => record.checkIds),
  );

  for (const check of profile.requiredChecks) {
    assert.ok(implementedChecks.has(check), check);
  }
});

test("known gaps remain visible instead of being advertised as implemented", () => {
  for (const capabilityId of [
    "CAP-P06-COVERAGE-ENFORCEMENT",
    "CAP-P09-RUNNER-ROUTING",
    "CAP-P16-SAST",
    "CAP-P16-SBOM-SIGNING",
  ]) {
    const record = matrix.records.find((item) => item.capabilityId === capabilityId);
    assert.ok(record, capabilityId);
    assert.notEqual(record.implementationStatus, "implemented", capabilityId);
  }
});
