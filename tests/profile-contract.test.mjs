import test from "node:test";
import assert from "node:assert/strict";

test("Laravel inherits required PHP and profile checks", async () => {
  const {loadProfile} = await import("../lib/load-profile.js");
  const profile = loadProfile("php-laravel");
  for (const id of ["php-syntax", "composer-lock", "dependency-audit", "sensitive-material-guard", "unit-test", "artifact-verify"]) {
    assert.ok(profile.requiredChecks.includes(id), id);
  }
  for (const unavailable of ["secret-scan", "sast", "coverage", "sbom-generation", "artifact-signing"]) {
    assert.equal(profile.requiredChecks.includes(unavailable), false, unavailable);
  }
});

test("Laravel package prohibits environment and private-key paths", async () => {
  const {loadProfile} = await import("../lib/load-profile.js");
  const patterns = loadProfile("php-laravel").prohibitedArtifactPatterns;
  assert.ok(patterns.includes("**/.env*"));
  assert.ok(patterns.includes("**/*.pem"));
  assert.ok(patterns.includes("**/*.key"));
});

test("resolved profile is immutable", async () => {
  const {loadProfile} = await import("../lib/load-profile.js");
  const profile = loadProfile("php-laravel");
  assert.throws(() => profile.requiredChecks.push("unsafe"), TypeError);
});
