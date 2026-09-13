# Public and Private Runner Trust Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memisahkan public verification plane berbasis GitHub-hosted runner dari private delivery plane berbasis `platform-ci`, dengan artifact immutable sebagai satu-satunya handoff.

**Architecture:** Repository public menguji, memindai, membangun, dan melakukan attestasi artifact tanpa secret internal. Repository private `platform-provisioning` memverifikasi source, checks, digest, provenance, dan authorization sebelum memberi pekerjaan deployment kepada runner internal. GitHub rulesets dan validator repository menegakkan batas ini.

**Tech Stack:** GitHub Actions, `ubuntu-24.04`, Node.js 24, TypeScript, JSON Schema, OCI/GHCR, BuildKit cache, SBOM, artifact attestation, Dependabot, CodeQL, GitHub Rulesets, Docker Compose, dan SSH wrapper terkontrol.

**Spec:** `docs/superpowers/specs/2026-09-13-public-private-runner-trust-boundary-design.md`

## Global Constraints

- Public workflow hanya memakai GitHub-hosted `ubuntu-24.04`.
- `self-hosted`, `platform-ci`, label custom, secret internal, SSH, kubeconfig, dan target internal dilarang pada repository public.
- Public pull request memakai permission read-only dan tidak memakai `pull_request_target` untuk menjalankan kode contributor.
- Artifact wajib immutable, terikat source SHA dan workflow SHA, serta mempunyai digest, SBOM, provenance, dan attestation.
- Deployment hanya berasal dari private `platform-provisioning` setelah verification gate.
- Self-hosted runner hanya tersedia bagi repository private yang dipilih eksplisit.
- External action dipin ke full 40-character commit SHA.
- Repository public memakai Apache-2.0, squash-only, signed web commits, dan automatic branch deletion.
- Production tidak otomatis deploy setelah merge ke `main`.
- Evidence aktual dan `platform-governance` tetap private.

---

### Task 1: Enforce the public execution boundary

**Files:**
- Create: `contracts/public-execution-boundary.schema.json`
- Create: `scripts/validate-public-execution-boundary.mjs`
- Create: `tests/public-execution-boundary.test.mjs`
- Modify: `scripts/validate-repository.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/validate-platform-workflow.yml`

**Interfaces:**
- Consumes: parsed workflow objects and repository mode `public`.
- Produces: `validateWorkflow(workflow): string[]` and `npm run validate:public-boundary`.

- [ ] **Step 1: Write failing tests**

```js
test("rejects internal runners", () => {
  const violations = validateWorkflow({jobs:{build:{"runs-on":["self-hosted","platform-ci"]}}});
  assert.match(violations.join("\n"), /internal runner label/);
});

test("rejects privileged fork execution", () => {
  const violations = validateWorkflow({on:{pull_request_target:{}},jobs:{build:{"runs-on":"ubuntu-24.04"}}});
  assert.match(violations.join("\n"), /pull_request_target/);
});

test("accepts GitHub-hosted read-only CI", () => {
  const violations = validateWorkflow({on:{pull_request:{}},permissions:{contents:"read"},jobs:{build:{"runs-on":"ubuntu-24.04"}}});
  assert.deepEqual(violations, []);
});
```

- [ ] **Step 2: Confirm red**

Run: `node --test tests/public-execution-boundary.test.mjs`

Expected: FAIL because the validator module does not exist.

- [ ] **Step 3: Implement exact validation rules**

Reject `self-hosted`, `platform-ci`, non-approved runner labels,
`pull_request_target`, `secrets: inherit`, unpinned reusable workflows, and keys
matching `/ssh|kubeconfig|target[_-]?host|private[_-]?key/i`.

- [ ] **Step 4: Wire the validator into repository validation**

Add:

```json
"validate:public-boundary": "node scripts/validate-public-execution-boundary.mjs"
```

Call it from `validate:repository` and from the validation workflow.

- [ ] **Step 5: Verify and commit**

Run: `node --test tests/public-execution-boundary.test.mjs && npm test && npm run lint && npm run typecheck`

```bash
git add contracts scripts tests package.json .github/workflows/validate-platform-workflow.yml
git commit -m "feat: enforce public workflow execution boundary"
```

### Task 2: Move OCI publication to GitHub-hosted execution

**Files:**
- Modify: `.github/workflows/build-oci-php-laravel.yml`
- Modify: `tests/oci-publication-workflow.test.mjs`
- Modify: `docs/profiles/php-laravel/README.md`
- Modify: `docs/TRACEABILITY.md`

**Interfaces:**
- Consumes: the existing OCI build contract.
- Produces: unchanged immutable OCI and evidence outputs.

- [ ] **Step 1: Change the test before the workflow**

```js
assert.equal(workflow.jobs.publish["runs-on"], "ubuntu-24.04");
assert.equal(workflow.jobs.publish.steps.some((step) => step.name === "Prepare reusable runner workspace"), false);
assert.equal(build.with["cache-from"], "type=gha,scope=php-laravel-oci");
assert.equal(build.with["cache-to"], "type=gha,scope=php-laravel-oci,mode=max");
```

- [ ] **Step 2: Confirm red**

Run: `node --test tests/oci-publication-workflow.test.mjs`

Expected: FAIL on the old self-hosted runner and local cache.

- [ ] **Step 3: Apply the migration**

Set `runs-on: ubuntu-24.04`, remove workspace ownership recovery, and replace
`/var/cache/platform` with the GitHub Actions cache settings above. Preserve
least-privilege permissions, immutable tags, SBOM, provenance, attestation, and
full-SHA action pins.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run lint && npm run typecheck && git diff --check`

```bash
git add .github/workflows/build-oci-php-laravel.yml tests/oci-publication-workflow.test.mjs docs
git commit -m "feat: publish OCI on GitHub-hosted runners"
```

### Task 3: Relocate private delivery code

**Files:**
- Delete from `platform-workflow`: `.github/workflows/deploy-container-host-development.yml`
- Delete from `platform-workflow`: `actions/container-host-deploy/action.yml`
- Delete from `platform-workflow`: `actions/generate-deployment-evidence/action.yml`
- Delete from `platform-workflow`: `actions/validate-container-host-deployment/action.yml`
- Delete from `platform-workflow`: `scripts/container-host-deploy.sh`
- Delete from `platform-workflow`: related deployment schemas, sources, bundles, fixtures, and tests
- Create in `platform-provisioning`: `package.json`
- Create in `platform-provisioning`: `contracts/artifact-promotion.schema.json`
- Create in `platform-provisioning`: `contracts/container-host-deployment.schema.json`
- Create in `platform-provisioning`: `contracts/deployment-result.schema.json`
- Create in `platform-provisioning`: `src/verify-artifact-promotion.mjs`
- Create in `platform-provisioning`: `src/generate-deployment-evidence.mjs`
- Create in `platform-provisioning`: `scripts/container-host-deploy.sh`
- Create in `platform-provisioning`: `tests/artifact-promotion.test.mjs`
- Create in `platform-provisioning`: `tests/container-host-deploy.test.mjs`
- Create in `platform-provisioning`: `tests/deployment-evidence.test.mjs`

**Interfaces:**
- Consumes: repository, source SHA, workflow SHA, artifact ID, immutable reference, digest, provenance reference, environment, target ID, authorization reference, and LKG digest.
- Produces: a verified promotion contract and allowlist-only evidence.

- [ ] **Step 1: Port tests first**

Tests reject mutable tags, unapproved repositories, arbitrary commands, network
fields, credential values, unsafe paths, contradictory digest/reference, and
unsupported environments.

- [ ] **Step 2: Confirm red in the private repository**

Run: `npm test`

Expected: FAIL because the private implementation is absent.

- [ ] **Step 3: Move the minimum implementation**

Use exact allowlists:

```js
const repositories = new Set(["OXY7O/example-app-laravel"]);
const workflowRepositories = new Set(["OXY7O/platform-workflow"]);
const environments = new Set(["development", "staging", "production"]);
```

Contracts never accept commands, hostname, username, port, secret name, or raw
runtime environment values.

- [ ] **Step 4: Remove active delivery implementation from public workflow**

Remove its package scripts and active navigation. Preserve historical changelog,
specification, and plan records.

- [ ] **Step 5: Verify both repositories**

Run in `platform-workflow`:
`npm test && npm run lint && npm run typecheck && npm run validate:repository`

Run in `platform-provisioning`:
`npm test && node --check src/verify-artifact-promotion.mjs && bash -n scripts/container-host-deploy.sh`

- [ ] **Step 6: Commit independently**

```bash
git -C platform-workflow add -A
git -C platform-workflow commit -m "refactor: isolate private deployment control plane"
git -C platform-provisioning add package.json contracts src scripts tests docs README.md
git -C platform-provisioning commit -m "feat: establish private artifact delivery plane"
```

### Task 4: Add the verified private deployment workflow

**Files:**
- Create: `platform-provisioning/.github/workflows/deploy-container-host.yml`
- Create: `platform-provisioning/.github/actions/verify-promotion/action.yml`
- Create: `platform-provisioning/.github/actions/deploy-container-host/action.yml`
- Create: `platform-provisioning/tests/private-workflow.test.mjs`
- Modify: `platform-provisioning/docs/OPERATOR-RUNBOOK.md`
- Modify: `platform-provisioning/docs/CONFIGURATION-CONTROL-MATRIX.md`

**Interfaces:**
- Consumes: typed `workflow_dispatch` identifiers and environment-scoped secrets.
- Produces: attempt ID, terminal status, active digest, rollback status, and safe evidence.

- [ ] **Step 1: Write structural tests**

```js
assert.deepEqual(deploy["runs-on"], ["self-hosted", "platform-ci"]);
assert.equal(deploy.environment, "${{ inputs.environment }}");
assert.equal(workflow.concurrency["cancel-in-progress"], false);
assert.ok(verifyIndex < deployIndex);
assert.doesNotMatch(source, /secrets:\s*inherit/);
```

- [ ] **Step 2: Confirm red**

Run: `node --test tests/private-workflow.test.mjs`

- [ ] **Step 3: Implement two-job separation**

Job `verify` runs on `ubuntu-24.04` with read-only permissions and validates
checks, source identity, OCI digest, and attestation. Job `deploy` needs
`verify`, reads environment secrets, and is the only job on
`[self-hosted, platform-ci]`.

- [ ] **Step 4: Cover positive and negative paths**

Fixtures cover valid promotion, digest mismatch, missing check, source mismatch,
unauthorized repository, expired authorization, and unsupported environment.
Only the valid fixture produces `verified=true`.

- [ ] **Step 5: Document private secrets**

Document only these names, never values:

```text
DEPLOY_SSH_PRIVATE_KEY
DEPLOY_KNOWN_HOSTS
DEPLOY_TARGET_HOST
DEPLOY_TARGET_USER
REGISTRY_PULL_TOKEN
```

- [ ] **Step 6: Verify and commit**

Run: `npm test && bash -n scripts/container-host-deploy.sh && git diff --check`

```bash
git add .github contracts src scripts tests docs README.md package.json
git commit -m "feat: add verified private deployment workflow"
```

### Task 5: Make Laravel a pure public verifier

**Files:**
- Delete: `example-app-laravel/.github/workflows/deploy-development.yml`
- Modify: `example-app-laravel/.github/workflows/publish-oci.yml`
- Modify: `example-app-laravel/tests/deployment-contract.test.mjs`
- Modify: `example-app-laravel/tests/repository-validation.test.mjs`
- Modify: `example-app-laravel/docs/TRACEABILITY.md`
- Modify: `example-app-laravel/README.md`

**Interfaces:**
- Consumes: public OCI reusable workflow at an immutable SHA.
- Produces: OCI digest, SBOM, provenance, and attestation without deployment.

- [ ] **Step 1: Write failing separation tests**

```js
assert.equal(fs.existsSync(".github/workflows/deploy-development.yml"), false);
assert.doesNotMatch(allWorkflows, /self-hosted|platform-ci|DEPLOY_|SSH_|kubeconfig/i);
assert.match(publish.jobs.publish.uses, /@[0-9a-f]{40}$/);
```

- [ ] **Step 2: Confirm red**

Run: `npm test`

- [ ] **Step 3: Remove deployment and update the workflow pin**

Keep public OCI publication on `development`. Generate artifact date inside the
reusable workflow rather than hard-coding a calendar date in the caller.

- [ ] **Step 4: Update onboarding and traceability**

Direct deployment operators to private `platform-provisioning`; state that this
repository proves public application verification only.

- [ ] **Step 5: Verify and commit**

Run: `npm test && node scripts/validate-repository.mjs && git diff --check`

```bash
git add -A .github README.md docs tests
git commit -m "refactor: separate public verification from deployment"
```

### Task 6: Add Apache-2.0 and community health

**Files in each public repository:**
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SUPPORT.md`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/dependabot.yml`
- Create: `.github/CODEOWNERS`

Repositories: `platform-workflow`, `platform-runtime-images`,
`example-app-laravel`, `example-app-go`, and `example-app-dotnet`.

**Interfaces:**
- Consumes: public contribution, support, and vulnerability reports.
- Produces: licensed reuse, structured intake, ownership, and dependency updates.

- [ ] **Step 1: Add failing health-file tests**

Assert every required file exists, LICENSE contains `Apache License` and
`Version 2.0`, security reports use private vulnerability reporting, issue forms
have required YAML fields, and Dependabot has weekly grouped updates.

- [ ] **Step 2: Confirm red in every repository**

Run each repository test command.

- [ ] **Step 3: Add exact Apache-2.0 and community files**

Use the unmodified Apache License 2.0 text. Resolve CODEOWNERS to existing OXY7O
teams through read-only API; do not commit placeholder owners.

- [ ] **Step 4: Configure Dependabot ecosystems**

- `platform-workflow`: npm and github-actions.
- `platform-runtime-images`: docker and github-actions.
- `example-app-laravel`: composer, npm, docker, and github-actions.
- `example-app-go`: gomod and github-actions.
- `example-app-dotnet`: nuget and github-actions.

- [ ] **Step 5: Verify and commit once per repository**

Run tests and `git diff --check`, then commit with:
`docs: add public community and security baseline`.

### Task 7: Apply rulesets and public security configuration

**Files:**
- Create: `docs/configuration/public-repository-baseline.json`
- Create: `docs/configuration/public-repository-baseline.md`
- Create: `tests/public-repository-baseline.test.mjs`

**Interfaces:**
- Consumes: public repository inventory and stable required-check names.
- Produces: desired state plus verified GitHub configuration.

- [ ] **Step 1: Write desired-state tests**

Require public visibility; squash-only; branch deletion disabled; force push
disabled; pull request, conversation resolution, signed commits, and stable
status checks required; protected `v*` tags; secret scanning, push protection,
Dependabot, CodeQL where supported, and private vulnerability reporting enabled.

- [ ] **Step 2: Confirm red**

Run: `node --test tests/public-repository-baseline.test.mjs`

- [ ] **Step 3: Record stable required checks**

Read successful main runs using `gh api`. Use aggregator check names instead of
matrix display names; add an aggregator job first if a repository has none.

- [ ] **Step 4: Apply GitHub configuration**

Apply branch/tag rulesets, security features, signed web commits, squash-only,
automatic branch deletion, Issues, Discussions, Projects, and Wiki where an
owner/process exists. Add no bypass actor unless it resolves to an approved team.
Keep public repositories excluded from all internal runner groups.

- [ ] **Step 5: Read back and compare actual state**

Verify repository metadata, security settings, CodeQL, rulesets, required checks,
tag protection, and runner visibility match the JSON desired state.

- [ ] **Step 6: Commit configuration documentation**

```bash
git add docs/configuration tests/public-repository-baseline.test.mjs
git commit -m "docs: define public repository security baseline"
```

### Task 8: Run pilots and publish SemVer releases

**Files:**
- Create: `example-app-laravel/docs/results/2026-09-14-public-oci-pilot.json`
- Create: `platform-provisioning/docs/results/2026-09-14-private-development-pilot.json`
- Modify: `platform-workflow/CHANGELOG.md`
- Modify: `platform-workflow/package.json`
- Modify: `platform-workflow/package-lock.json`
- Modify: `platform-workflow/repository-policy.json`
- Modify: `example-app-laravel/CHANGELOG.md`
- Modify: `example-app-laravel/package.json`
- Modify: `example-app-laravel/package-lock.json`
- Modify: `platform-provisioning/CHANGELOG.md`

**Interfaces:**
- Consumes: merged public workflow SHA, verified OCI digest, authorization, and configured development environment.
- Produces: actual pilot evidence and verified SemVer releases.

- [ ] **Step 1: Merge platform-workflow through green checks**

Require tests, lint, typecheck, repository/boundary validation, CodeQL,
dependency review, and actionlint. Record the squash merge SHA.

- [ ] **Step 2: Run public OCI positive and negative pilots**

Positive: verify GitHub-hosted execution, immutable digest, SBOM, provenance,
attestation, source SHA, and workflow SHA. Negative: internal runner label,
mutable image, secret field, unpinned action, and `pull_request_target` must fail
before artifact publication.

- [ ] **Step 3: Merge and configure private provisioning**

Configure development secrets in the GitHub UI without printing values. Runner
group includes only `platform-provisioning` and excludes every public repository.

- [ ] **Step 4: Run private positive, rejection, and rollback pilots**

Valid artifact deploys and passes `/up`. Digest mismatch stops before runner
allocation. Failed health check produces LKG rollback. Evidence contains no host,
username, credential, key, or runtime secret.

- [ ] **Step 5: Verify release candidates**

Run all local suites on clean merged branches and verify GitHub checks, CodeQL,
Dependabot, rulesets, licenses, OCI evidence, deployment evidence, and release
target SHAs.

- [ ] **Step 6: Publish releases without rewriting history**

Publish `platform-workflow@v0.7.0`, `example-app-laravel@v0.5.0`, and the next
unused minor version of `platform-provisioning`, each targeting its exact tested
merge SHA. Never move or replace an existing tag.

- [ ] **Step 7: Update operational traceability**

Mark only controls backed by actual evidence as operationally compliant.
Staging, production, Kubernetes, and public self-hosted execution remain
explicitly unsupported in this release.

---

## Final verification

```bash
npm --prefix platform-workflow test
npm --prefix platform-workflow run lint
npm --prefix platform-workflow run typecheck
npm --prefix platform-workflow run validate:repository
npm --prefix platform-provisioning test
npm --prefix example-app-laravel test
```

Expected: every command exits `0`; worktrees are clean; public workflows contain
no internal runner label; public artifact identity is verifiable; private
deployment consumes that exact artifact and produces safe evidence.
