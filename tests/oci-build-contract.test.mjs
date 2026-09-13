import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const fixture = () => JSON.parse(fs.readFileSync("tests/fixtures/contracts/valid-oci-build-laravel.json", "utf8"));

test("accepts the governed Laravel OCI build contract", async () => {
  const {validateOciBuildInput} = await import("../lib/validate-oci-build-input.js");
  const result = validateOciBuildInput(fixture());
  assert.equal(result.profileKey, "php-laravel");
  assert.deepEqual(result.platforms, ["linux/amd64"]);
});

test("returns the same OCI contract digest for different key order", async () => {
  const {calculateOciBuildContractDigest} = await import("../lib/validate-oci-build-input.js");
  const input = fixture();
  const reversed = Object.fromEntries(Object.entries(input).reverse());
  assert.equal(calculateOciBuildContractDigest(input), calculateOciBuildContractDigest(reversed));
});

test("rejects mutable image references", async () => {
  const {validateOciBuildInput} = await import("../lib/validate-oci-build-input.js");
  for (const imageRepository of ["ghcr.io/oxy7o/app:latest", "ghcr.io/oxy7o/app@sha256:" + "a".repeat(64)]) {
    assert.throws(() => validateOciBuildInput({...fixture(), imageRepository}), /imageRepository/i);
  }
});

test("rejects caller-controlled commands and build arguments", async () => {
  const {validateOciBuildInput} = await import("../lib/validate-oci-build-input.js");
  assert.throws(() => validateOciBuildInput({...fixture(), buildCommand: "docker build ."}), /additional propert/i);
  assert.throws(() => validateOciBuildInput({...fixture(), buildArgs: {APP_ENV: "production"}}), /additional propert/i);
});

test("rejects unsafe build paths", async () => {
  const {validateOciBuildInput} = await import("../lib/validate-oci-build-input.js");
  for (const invalid of [
    {dockerfilePath: "/tmp/Dockerfile"},
    {dockerfilePath: "../Dockerfile"},
    {contextPath: "/workspace"},
    {contextPath: "../workspace"}
  ]) {
    assert.throws(() => validateOciBuildInput({...fixture(), ...invalid}), /dockerfilePath|contextPath/i);
  }
  assert.throws(
    () => validateOciBuildInput({...fixture(), contextPath: "app", dockerfilePath: "Dockerfile"}),
    /dockerfilePath.*contextPath/i
  );
});

test("rejects unsupported identity and malformed source SHA", async () => {
  const {validateOciBuildInput} = await import("../lib/validate-oci-build-input.js");
  assert.throws(() => validateOciBuildInput({...fixture(), profileKey: "go-service"}), /profileKey/i);
  assert.throws(() => validateOciBuildInput({...fixture(), sourceSha: "main"}), /sourceSha/i);
});
