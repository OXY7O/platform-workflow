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
  assert.equal(laravel.exampleRepository, "https://github.com/OXY7O/example-app-laravel");
});

test("Go Service exposes a workflow candidate without claiming complete availability", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const profile = catalogue.profiles["go-service"];
  assert.equal(profile.availability, "in-progress");
  assert.equal(profile.workflowAvailability, "available");
  assert.equal(profile.exampleAvailability, "planned");
  assert.equal(profile.lifecycle, "pilot");
  assert.equal(profile.compatibility, "not-validated");
  assert.match(profile.workflowReference, /ci-profile-go-service\.yml@[a-f0-9]{40}$/);
  assert.equal(profile.exampleRepository, null);
});

test("planned profiles do not advertise executable resources", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogue/technology-stack.json", "utf8"));
  const planned = Object.values(catalogue.profiles).filter((profile) => profile.availability === "planned");
  assert.equal(planned.length, 4);
  for (const profile of planned) {
    assert.equal(profile.workflowReference, null);
    assert.equal(profile.exampleRepository, null);
  }
});

test("README links only the available profile implementation", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  assert.match(readme, /docs\/profiles\/php-laravel\/README\.md/);
  assert.match(readme, /OXY7O\/example-app-laravel/);
  assert.match(readme, /docs\/profiles\/go-service\/README\.md/);
  assert.match(readme, /In progress/);
  assert.doesNotMatch(readme, /OXY7O\/example-app-go/);
  assert.doesNotMatch(readme, /OXY7O\/example-app-dotnet/);
  assert.doesNotMatch(readme, /demo-app/);
});
