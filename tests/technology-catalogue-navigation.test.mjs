import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("machine catalogue separates availability from governance compliance", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const laravel = catalogue.profiles["php-laravel"];
  assert.equal(laravel.availability, "available");
  assert.equal(laravel.lifecycle, "pilot");
  assert.equal(laravel.compatibility, "not-validated");
  assert.match(laravel.workflowReference, /@[a-f0-9]{40}$/);
  assert.match(laravel.workflowReference, /ci-profile-php-laravel\.yml@1d51c025059c9bc3bca4fd2ed6c09b9627129399$/);
  assert.equal(laravel.exampleRepository, "https://github.com/OXY7O/example-app-laravel");
  assert.equal(laravel.runtimeLogicalId, "php-ci/8.3");
  assert.equal(laravel.runtimeRelease, "0.1.1");
  assert.equal(
    laravel.runtimeImageReference,
    "ghcr.io/oxy7o/platform-ci-php@sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69",
  );
  assert.equal(
    laravel.runtimeCatalogue,
    "https://github.com/OXY7O/platform-runtime-images/blob/v0.1.1/catalogue/php-ci.json",
  );
  assert.equal(laravel.capabilities.ociPublication.availability, "pilot");
  assert.equal(laravel.capabilities.containerHostDevelopment.availability, "private-control-plane");
  assert.equal(laravel.capabilities.containerHostDevelopment.deliveryControlPlane, "OXY7O/platform-provisioning");
  assert.equal(laravel.capabilities.containerHostDevelopment.workflowReference, null);
});

test("Laravel documentation exposes the approved runtime traceability", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const profile = fs.readFileSync("docs/profiles/php-laravel/README.md", "utf8");
  for (const source of [readme, profile]) {
    assert.match(source, /platform-runtime-images/);
    assert.match(source, /php-ci\/8\.3/);
    assert.match(source, /v0\.1\.1/);
    assert.match(source, /sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69/);
  }
});

test("Go Service exposes its released workflow and example without a compliance claim", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const profile = catalogue.profiles["go-service"];
  assert.equal(profile.availability, "available");
  assert.equal(profile.workflowAvailability, "available");
  assert.equal(profile.exampleAvailability, "available");
  assert.equal(profile.lifecycle, "pilot");
  assert.equal(profile.compatibility, "not-validated");
  assert.match(profile.workflowReference, /ci-profile-go-service\.yml@010dee6edcdf21f813e842ef3f193f4a2c83593e$/);
  assert.equal(profile.exampleRepository, "https://github.com/OXY7O/example-app-go");
});

test("planned profiles do not advertise executable resources", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const planned = Object.values(catalogue.profiles).filter((profile) => profile.availability === "planned");
  assert.equal(planned.length, 3);
  for (const profile of planned) {
    assert.equal(profile.workflowReference, null);
    assert.equal(profile.exampleRepository, null);
  }
});

test(".NET Web API exposes its released workflow, example, and pilot boundary", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const profile = catalogue.profiles["dotnet-webapi"];
  assert.equal(catalogue.families.dotnet.availability, "available");
  assert.equal(profile.availability, "available");
  assert.equal(profile.workflowAvailability, "available");
  assert.equal(profile.exampleAvailability, "available");
  assert.equal(profile.lifecycle, "pilot");
  assert.equal(profile.compatibility, "not-validated");
  assert.match(profile.workflowReference, /ci-profile-dotnet-webapi\.yml@451f980e3f4b9d926b7b340b42f7f611d75db1d2$/);
  assert.equal(profile.exampleRepository, "https://github.com/OXY7O/example-app-dotnet");
});

test("README links only the available profile implementation", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/profiles\/php-laravel\/README\.md/);
  assert.match(readme, /OXY7O\/example-app-laravel/);
  assert.match(readme, /docs\/profiles\/go-service\/README\.md/);
  assert.match(readme, /OXY7O\/example-app-go/);
  assert.match(readme, /docs\/profiles\/dotnet-webapi\/README\.md/);
  assert.match(readme, /OXY7O\/example-app-dotnet/);
  assert.doesNotMatch(readme, /demo-app/);
});
