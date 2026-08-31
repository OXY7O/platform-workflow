import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const catalogue = JSON.parse(
  fs.readFileSync("catalogue/technology-capabilities.json", "utf8"),
);

test("technology capability catalogue identifies Laravel without support overclaim", () => {
  assert.equal(catalogue.governanceBaseline, "platform-governance@v1.5.1");
  const family = catalogue.families.find((item) => item.familyKey === "php");
  const profile = family.profiles.find((item) => item.profileKey === "php-laravel");

  assert.equal(profile.availability, "available");
  assert.equal(profile.lifecycle, "pilot");
  assert.equal(profile.compatibility, "not-validated");
  assert.equal(profile.operationalCompliance, "not-assessed");
  assert.ok(profile.versionLanes.some((lane) => lane.channel === "canonical"));
  assert.ok(profile.versionLanes.some((lane) => lane.channel === "legacy" && lane.eligibleForNewProjects === false));
});

test("capability catalogue distinguishes available, gap, and planned behavior", () => {
  const profile = catalogue.families[0].profiles[0];
  const byKey = new Map(profile.capabilities.map((item) => [item.capabilityKey, item]));

  assert.equal(byKey.get("ci.frozen-dependency").status, "implemented");
  assert.equal(byKey.get("ci.dependency-audit").status, "implemented");
  assert.equal(byKey.get("ci.coverage-enforcement").status, "implementation-gap");
  assert.equal(byKey.get("security.sast").status, "planned");
  assert.equal(byKey.get("deployment.kubernetes").status, "planned");
});

test("unimplemented extensions cannot be selected", () => {
  const profile = catalogue.families[0].profiles[0];
  assert.deepEqual(profile.selectableExtensions, []);
});

test("each version lane is exact and unvalidated compatibility is not overclaimed", () => {
  const profile = catalogue.families[0].profiles[0];
  const ids = new Set();
  for (const lane of profile.versionLanes) {
    assert.doesNotMatch(lane.phpVersion, /-/);
    assert.equal(ids.has(lane.combinationId), false, lane.combinationId);
    ids.add(lane.combinationId);
    if (lane.channel !== "canonical") assert.equal(lane.verification, "not-verified", lane.combinationId);
  }
});
