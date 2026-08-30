import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("README is a cross-stack workflow portal", () => {
  const readme = read("README.md");
  for (const text of [
    "Governance baseline", "Katalog tech stack", "Available", "Planned",
    "PHP/Laravel", "Go", ".NET", "Python", "TypeScript/Node.js",
    "Java/Spring Boot", "Cara memilih profile", "Alur onboarding",
  ]) {
    assert.match(readme, new RegExp(escape(text)));
  }

  const header = readme.split("\n").slice(0, 12).join("\n");
  assert.equal((header.match(/!\[/g) ?? []).length, 4);
  assert.match(header, /Versi release/);
  assert.match(header, /Status CI/);
  assert.match(header, /Governance baseline/);
  assert.match(header, /Tanpa deployment/);
  assert.doesNotMatch(header, /Profil PHP\/Laravel/);
});

test("PHP Laravel detail preserves technical depth and onboarding", () => {
  const profile = read("docs/profiles/php-laravel/README.md");
  for (const text of [
    "Status profile", "Workflow yang tersedia", "Compatibility matrix",
    "Kontrak input", "Output dan artifact", "Safe evidence metadata",
    "Onboarding checklist", "Troubleshooting", "example-app-laravel",
    "ci-qualified",
  ]) {
    assert.match(profile, new RegExp(escape(text)));
  }
});

test("Go Service detail documents its complete technical contract and released example", () => {
  const profile = read("docs/profiles/go-service/README.md");
  for (const text of [
    "Status profile", "Go 1.26.7", "Go 1.27.0", "Kontrak input",
    "Required checks", "Binary artifact", "Failure taxonomy",
    "Troubleshooting", "Thin caller", "example-app-go", "v0.1.0",
    "ci-qualified", "Tanpa deployment",
  ]) {
    assert.match(profile, new RegExp(escape(text)));
  }
});

test(".NET Web API detail explains the pilot contract without overstating availability", () => {
  const profile = read("docs/profiles/dotnet-webapi/README.md");
  for (const text of [
    "Status profile", ".NET SDK 10.0.110", "net10.0", "linux-x64",
    "11.0.100-preview.6.26359.118", "Kontrak input", "Required checks",
    "application package", "Failure taxonomy", "Troubleshooting", "Thin caller",
    "example-app-dotnet", "ci-qualified", "Safe evidence metadata", "Tanpa deployment",
  ]) assert.match(profile, new RegExp(escape(text)));
  assert.match(profile, /Available/i);
  assert.match(profile, /example-app-dotnet/);
  assert.match(profile, /33317740112/);
  assert.match(profile, /bukan klaim `supported`/i);
  assert.match(profile, /not-validated/i);
});

test("v0.2.1 release note remains available as history", () => {
  const changelog = read("CHANGELOG.md");
  assert.match(changelog, /## \[0\.2\.1\]/);
  assert.match(changelog, /Tidak ada perubahan kontrak/);
});
