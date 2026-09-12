import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

const paths = [".github/workflows/ci-family-php.yml", ".github/workflows/ci-profile-php-laravel.yml"];
const load = (path) => parse(fs.readFileSync(path, "utf8"));
const approvedRuntime =
  "ghcr.io/oxy7o/platform-ci-php@sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69";

test("both CI workflows expose workflow_call under read-only permission", () => {
  for (const path of paths) {
    const workflow = load(path);
    assert.ok(workflow.on.workflow_call, path);
    assert.deepEqual(workflow.permissions, {contents: "read"});
    assert.equal(Object.keys(workflow.jobs).some((id) => id.includes("deploy")), false);
  }
});

test("Laravel profile exposes governed artifact outputs", () => {
  const workflow = load(paths[1]);
  for (const output of ["readiness", "failure-category", "artifact-id", "artifact-name", "artifact-digest", "manifest-digest", "evidence-metadata"]) {
    assert.ok(workflow.on.workflow_call.outputs[output], output);
  }
});

test("Laravel package binds the real lock digest and artifact evidence", () => {
  const source = fs.readFileSync(paths[1], "utf8");
  assert.match(source, /sha256sum.*composer\.lock/);
  assert.doesNotMatch(source, /"0"\.repeat\(64\)/);
  assert.match(source, /"artifact":\{"artifactId":/);
  assert.doesNotMatch(source, /export INPUT_BUILD_INPUT="\$\(/);
});

test("canonical PHP jobs run only in the approved immutable runtime", () => {
  const family = load(paths[0]);
  const profile = load(paths[1]);

  assert.equal(family.jobs["php-family"].container.image, approvedRuntime);
  assert.equal(profile.jobs.package.container.image, approvedRuntime);
  assert.equal(family.jobs["php-family"].container.credentials, undefined);
  assert.equal(profile.jobs.package.container.credentials, undefined);

  for (const path of paths) {
    assert.doesNotMatch(fs.readFileSync(path, "utf8"), /shivammathur\/setup-php/);
  }
});

test("Laravel evidence identifies the approved runtime digest", () => {
  const source = fs.readFileSync(paths[1], "utf8");
  assert.match(source, /"governanceVersion":"v1\.5\.0"/);
  assert.match(source, /"catalogueVersion":"1\.2\.0"/);
  assert.match(source, /"runnerImage":"ghcr\.io\/oxy7o\/platform-ci-php@sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69"/);
  assert.doesNotMatch(source, /"runnerImage":"ubuntu-24\.04"/);
});

test("all external actions are pinned to a full commit SHA", () => {
  for (const path of paths) {
    const workflow = load(path);
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        if (!step.uses || step.uses.startsWith("./")) continue;
        assert.match(step.uses, /^[^@]+@[a-f0-9]{40}$/, `${path}: ${step.uses}`);
      }
    }
  }
});

test("reusable workflows consume their private implementation as immutable actions", () => {
  const implementationSha = "4058870b25de8a9432762f144381d6c416644e2c";

  for (const path of paths) {
    const workflow = load(path);
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        assert.notEqual(step.with?.repository, "OXY7O/platform-workflow", `${path}: ${step.name}`);
      }
    }
  }

  const family = load(paths[0]);
  const familyUses = family.jobs["php-family"].steps.map((step) => step.uses).filter(Boolean);
  assert.ok(familyUses.includes(`OXY7O/platform-workflow/actions/validate-caller-contract@${implementationSha}`));
  assert.ok(familyUses.includes(`OXY7O/platform-workflow/actions/php-family-check@${implementationSha}`));

  const profile = load(paths[1]);
  const packageUses = profile.jobs.package.steps.map((step) => step.uses).filter(Boolean);
  assert.ok(packageUses.includes(`OXY7O/platform-workflow/actions/laravel-profile-check@${implementationSha}`));
  assert.ok(packageUses.includes(`OXY7O/platform-workflow/actions/build-application-package@${implementationSha}`));
  assert.ok(packageUses.includes(`OXY7O/platform-workflow/actions/normalize-check-results@${implementationSha}`));
});

test("self-validation limits ShellCheck to repository scripts", () => {
  const workflow = load(".github/workflows/validate-platform-workflow.yml");
  const step = workflow.jobs.validate.steps.find((candidate) => candidate.name === "Run ShellCheck");
  assert.equal(step.with.scandir, "scripts");
  assert.equal(step.with.check_together, true);
});
