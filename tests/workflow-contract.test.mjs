import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

const paths = [".github/workflows/ci-family-php.yml", ".github/workflows/ci-profile-php-laravel.yml"];
const load = (path) => parse(fs.readFileSync(path, "utf8"));

test("both CI workflows expose workflow_call under read-only permission", () => {
  for (const path of paths) {
    const workflow = load(path);
    assert.ok(workflow.on.workflow_call, path);
    assert.deepEqual(workflow.permissions, {contents: "read"});
    assert.equal(Object.keys(workflow.jobs).some((id) => id.includes("deploy")), false);
  }
});

test("all Laravel CI jobs route only to the platform-ci self-hosted runner", () => {
  for (const path of [...paths, ".github/workflows/ci-compatibility-php-laravel.yml"]) {
    const workflow = load(path);
    for (const [jobId, job] of Object.entries(workflow.jobs)) {
      assert.deepEqual(job["runs-on"], ["self-hosted", "platform-ci"], `${path}: ${jobId}`);
    }
  }
});

test("all Laravel CI jobs run inside approved immutable PHP containers", () => {
  const approvedDigests = [
    "sha256:6ca4b01d84082465358c5d541a2bef0edd9d0be494802aeb40f2d7c7a8d73adb",
    "sha256:177529735599a8244b2c903522f029839dce1c2ac4be122fdc00ada4b45a20e4",
    "sha256:9cc9310a457019cd6b682109eb3c5dd8bf73498e7d3b9ee5c33d0d0b83d0faf3",
    "sha256:b80dfc7d2bc0fc97755620a0dfb3d5e8e9cbf70a2970ea2d5c9dc64154b31422",
  ];

  for (const path of [...paths, ".github/workflows/ci-compatibility-php-laravel.yml"]) {
    const workflow = load(path);
    for (const [jobId, job] of Object.entries(workflow.jobs)) {
      assert.equal(typeof job.container?.image, "string", `${path}: ${jobId}`);
      assert.match(job.container.image, /^\$\{\{ .+ \}\}$/u, `${path}: ${jobId}`);
      assert.doesNotMatch(job.container.image, /:latest(?:@|$)/u, `${path}: ${jobId}`);
      for (const digest of approvedDigests) {
        assert.ok(job.container.image.includes(digest), `${path}: ${jobId} missing ${digest}`);
      }
    }
  }
});

test("all Laravel CI jobs use version-isolated persistent Composer cache volumes", () => {
  for (const path of [...paths, ".github/workflows/ci-compatibility-php-laravel.yml"]) {
    const workflow = load(path);
    for (const [jobId, job] of Object.entries(workflow.jobs)) {
      assert.equal(job.env.COMPOSER_CACHE_DIR, "/var/cache/platform/composer", `${path}: ${jobId}`);
      assert.equal(job.env.COMPOSER_ALLOW_SUPERUSER, "1", `${path}: ${jobId}`);
      assert.deepEqual(
        job.container.volumes,
        ["platform-ci-composer-php-${{ inputs.php-version }}:/var/cache/platform/composer"],
        `${path}: ${jobId}`,
      );
    }
  }
});

test("runner cache maintenance preserves approved images and bounds transient cache", () => {
  const script = fs.readFileSync("scripts/maintain-runner-cache.sh", "utf8");
  for (const version of ["8.2", "8.3", "8.4", "8.5"]) {
    assert.match(script, new RegExp(`php:${version}-cli-bookworm@sha256:`));
  }
  assert.match(script, /node:24-bookworm@sha256:/u);
  assert.match(script, /docker image prune --force --filter "until=168h"/u);
  assert.match(script, /docker builder prune --force --filter "until=168h" --keep-storage "10GB"/u);
  assert.doesNotMatch(script, /docker (?:image |volume )?prune[^\n]*--all/u);
  assert.doesNotMatch(script, /docker volume prune/u);
});

test("actionlint recognizes the governed custom runner label", () => {
  const config = load(".github/actionlint.yaml");
  assert.deepEqual(config["self-hosted-runner"].labels, ["platform-ci"]);
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
  assert.match(source, /const artifact = uploaded \? \{/);
  assert.match(source, /artifact,\n\s+evidenceReference/);
  assert.doesNotMatch(source, /export INPUT_BUILD_INPUT="\$\(/);
});

test("Laravel normalized result consumes granular executed checks", () => {
  const workflow = load(paths[1]);
  const steps = workflow.jobs.package.steps;
  const collector = steps.find((step) => step.id === "checks");
  const evidence = steps.find((step) => step.id === "evidence");
  const normalize = steps.find((step) => step.id === "normalize");

  assert.ok(collector, "granular check collector is required");
  assert.equal(collector.if, "always()");
  assert.equal(collector.env.UPLOAD_OUTCOME, "${{ steps.upload.outcome }}");
  assert.match(collector.run, /UPLOAD_OUTCOME.*success/);
  assert.equal(evidence.if, "always()");
  assert.match(evidence.run, /uploaded \? \{/);
  assert.match(evidence.run, /: null/);
  assert.equal(normalize.with.checks, "${{ steps.checks.outputs.checks-json }}");
  assert.equal(normalize.with.evidence, "${{ steps.evidence.outputs.evidence-json }}");
});

test("Laravel keeps contract validation and failure normalization in one job", () => {
  const workflow = load(paths[1]);
  assert.deepEqual(Object.keys(workflow.jobs), ["package"]);
  const steps = workflow.jobs.package.steps;
  assert.ok(steps.find((step) => step.id === "contract"));
  assert.ok(steps.find((step) => step.id === "checks"));
  assert.ok(steps.find((step) => step.id === "evidence"));
  assert.ok(steps.find((step) => step.id === "normalize"));
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
  const implementationSha = "40b7d0bd8a4c4cf98e7b938518cfad2a9a55094b";

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
