# Platform Runtime Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun image factory terpisah yang merilis controlled PHP CI toolchain image ke GHCR public, mengonsumsinya secara immutable pada workflow Laravel, dan membuktikannya pada self-hosted runner `platform-ci`.

**Architecture:** Repository baru `OXY7O/platform-runtime-images` membangun, menguji, memindai, menandatangani, serta merilis image berdasarkan machine-readable catalogue. `platform-workflow` mengonsumsi literal `registry@sha256` hasil release dan tidak lagi menjalankan `setup-php`. `example-app-laravel` menjadi verifikator aktual untuk cold/warm cache dan seluruh required lane.

**Tech Stack:** Docker/BuildKit, GitHub Actions, GHCR, PHP 8.2–8.5, Composer 2, Node.js 24, Xdebug, JSON Schema 2020-12, ShellCheck, Trivy, Syft, Cosign, GitHub artifact attestations.

**Spec:** `docs/superpowers/specs/2026-09-01-platform-runtime-images-design.md`

## Global Constraints

- GHCR package public adalah registry default; repository factory boleh private.
- Semua base image, action, dan consumer image menggunakan immutable digest/full SHA; tag `latest` dilarang.
- Kloter implementasi dimulai dengan PHP 8.3 vertical slice sebelum PHP 8.2, 8.4, dan 8.5.
- Image target awal hanya `linux/amd64`.
- CI image tidak membawa source aplikasi, `vendor`, `node_modules`, cache dependency, secret, credential, environment value, atau deployment configuration.
- Composer/npm cache berada pada named volume runner, terisolasi per versi runtime, dan bukan evidence.
- Job aplikasi tidak memperoleh Docker socket atau permission publish.
- Registry mandiri memakai mirror-by-digest dan verification gate; tidak ada failover otomatis.
- Status operationally verified hanya boleh diberikan setelah actual runner evidence lulus.

---

### Task 1: Repository Bootstrap dan Catalogue Contract

**Files:**
- Create in new repository: `package.json`
- Create: `catalogue/php-ci.json`
- Create: `catalogue/php-ci.schema.json`
- Create: `scripts/validate-catalogue.mjs`
- Create: `tests/catalogue.test.mjs`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: catalogue entries `{logicalId, phpMinor, lifecycle, platforms, baseImage, toolchain, locations}`.
- Produces: `npm test` and `npm run validate:catalogue` as the repository verification entry points.

- [ ] **Step 1: Create `OXY7O/platform-runtime-images` as a private repository with no initialized files**

Run:

```bash
gh repo create OXY7O/platform-runtime-images --private --disable-issues --disable-wiki
```

Expected: repository exists, has no release package, and no branch protection is claimed yet.

- [ ] **Step 2: Create an isolated worktree/clone and write the failing catalogue tests**

Tests must assert:

```js
assert.equal(entry.logicalId, "php-ci/8.3");
assert.equal(entry.phpMinor, "8.3");
assert.equal(entry.lifecycle, "canonical");
assert.deepEqual(entry.platforms, ["linux/amd64"]);
assert.match(entry.baseImage, /^php:8\.3-cli-bookworm@sha256:[a-f0-9]{64}$/u);
assert.equal(entry.locations["ghcr-public"], null);
assert.equal(entry.locations["self-managed"], null);
```

Negative tests must reject `latest`, unknown fields, duplicate logical IDs, non-digest base images, unsupported platforms, and a populated location without a verified digest.

- [ ] **Step 3: Run tests and verify RED**

Run: `node --test tests/catalogue.test.mjs`  
Expected: FAIL because schema, catalogue, and validator do not exist.

- [ ] **Step 4: Implement the minimal schema, PHP 8.3 entry, and validator**

Use base image:

```text
php:8.3-cli-bookworm@sha256:177529735599a8244b2c903522f029839dce1c2ac4be122fdc00ada4b45a20e4
```

Set `additionalProperties: false` at every object boundary. Locations remain `null` until a release is pulled and verified by digest.

- [ ] **Step 5: Run catalogue tests and repository validation**

Run: `npm test && npm run validate:catalogue`  
Expected: PASS with exactly one canonical entry and no published location.

- [ ] **Step 6: Commit bootstrap**

```bash
git add package.json catalogue scripts tests .gitignore README.md
git commit -m "feat: establish runtime image catalogue contract"
```

### Task 2: PHP 8.3 Controlled Image dan Doctor Contract

**Files:**
- Create: `images/php-ci/Dockerfile`
- Create: `images/php-ci/doctor.sh`
- Create: `images/php-ci/entrypoint.sh`
- Create: `images/php-ci/test/fixture/composer.json`
- Create: `images/php-ci/test/fixture/composer.lock`
- Create: `scripts/build-image.sh`
- Create: `scripts/verify-image.sh`
- Create: `tests/php-image-contract.test.mjs`

**Interfaces:**
- Consumes: `catalogue/php-ci.json` logical ID `php-ci/8.3`.
- Produces: local image `platform-ci-php:php-8.3-test`.
- Produces: `/usr/local/bin/php-ci-doctor --json` with exact runtime metadata.

- [ ] **Step 1: Write failing image contract tests**

Tests invoke the build/verify scripts and assert doctor JSON fields:

```json
{
  "schemaVersion": "1.0",
  "logicalId": "php-ci/8.3",
  "phpMinor": "8.3",
  "composerMajor": "2",
  "nodeMajor": "24",
  "architecture": "amd64"
}
```

Assert required extensions `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `intl`, `mbstring`, `opcache`, `pcntl`, `pdo`, `pdo_mysql`, `tokenizer`, `xml`, `xdebug`, and `zip`. Assert `/workspace/vendor`, `/workspace/node_modules`, `/root/.composer/auth.json`, and known private-key patterns are absent.

- [ ] **Step 2: Run the image test and verify RED**

Run: `node --test tests/php-image-contract.test.mjs`  
Expected: FAIL because the Dockerfile and scripts do not exist.

- [ ] **Step 3: Implement the smallest PHP 8.3 Dockerfile**

The Dockerfile must:

- start from catalogue-approved base digest;
- install only packages required to compile approved PHP extensions;
- install Composer 2 and Node.js 24 from verified sources;
- install required PHP extensions and Xdebug;
- remove apt indexes, compiler residue not needed at runtime, temporary archives, and package manager caches;
- copy `php-ci-doctor` and set OCI source/revision/version labels;
- not copy the repository root or test fixture into the final stage.

- [ ] **Step 4: Implement build and verification scripts**

`build-image.sh php-ci/8.3 platform-ci-php:php-8.3-test` must read the catalogue rather than accept a free base image. `verify-image.sh` must execute doctor, extension checks, Composer locked install against the mounted fixture, PHPUnit smoke test, and prohibited-content scan.

- [ ] **Step 5: Run tests and inspect final image history**

Run:

```bash
npm test
docker history --no-trunc platform-ci-php:php-8.3-test
docker image inspect platform-ci-php:php-8.3-test
```

Expected: PASS; no secret/build argument value appears in history or config.

- [ ] **Step 6: Commit the vertical slice**

```bash
git add images scripts tests
git commit -m "feat: build verified PHP 8.3 CI toolchain image"
```

### Task 3: Pull Request Validation, Scan, dan SBOM

**Files:**
- Create: `.github/workflows/validate.yml`
- Create: `.github/actionlint.yaml`
- Create: `policies/vulnerability-policy.json`
- Create: `scripts/evaluate-vulnerabilities.mjs`
- Create: `tests/workflow-contract.test.mjs`
- Create: `tests/vulnerability-policy.test.mjs`

**Interfaces:**
- Consumes: local image output from `scripts/build-image.sh`.
- Produces: test result, Trivy JSON, SPDX/CycloneDX SBOM, and normalized scan decision without publishing an image.

- [ ] **Step 1: Write failing workflow and policy tests**

Assert validation workflow has `contents: read`, no `packages: write`, no `id-token: write`, exact self-hosted runner labels, pinned action SHAs, and no `pull_request_target`. Policy tests must reject Critical/High fixed vulnerabilities and require `{id, owner, expiresAt, remediation}` for an exception.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/workflow-contract.test.mjs tests/vulnerability-policy.test.mjs`  
Expected: FAIL because workflow and policy evaluator are absent.

- [ ] **Step 3: Implement validation workflow and normalized evaluator**

Order: catalogue validation → image build → doctor/smoke test → Syft SBOM → Trivy JSON → policy evaluation → upload non-secret validation evidence. External actions must use reviewed full commit SHAs.

- [ ] **Step 4: Run local contract tests and open a draft PR**

Run: `npm test && npm run validate:catalogue && git diff --check`  
Expected: PASS. Push branch and create a draft PR; CI must build but must not publish.

- [ ] **Step 5: Commit validation pipeline**

```bash
git add .github policies scripts tests
git commit -m "ci: validate scan and inventory runtime images"
```

### Task 4: Protected GHCR Release, Signing, dan Provenance

**Files:**
- Create: `.github/workflows/release.yml`
- Create: `scripts/record-release.mjs`
- Create: `tests/release-contract.test.mjs`
- Modify: `catalogue/php-ci.schema.json`
- Modify: `README.md`
- Create: `docs/OPERATIONS.md`

**Interfaces:**
- Consumes: a signed Git tag and protected `runtime-image-release` environment.
- Produces: public GHCR reference composed from repository
  `ghcr.io/oxy7o/platform-ci-php` and the verified `sha256` digest emitted by
  BuildKit, plus the matching catalogue location record.

- [ ] **Step 1: Write failing release contract tests**

Assert release workflow triggers only from `workflow_dispatch` with a validated release version or tags matching `runtime-images-v*`; permissions are `contents: read`, `packages: write`, `id-token: write`, and `attestations: write`; PR workflows cannot call it; image is tested again after pull-by-digest before catalogue update.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/release-contract.test.mjs`  
Expected: FAIL because release workflow is absent.

- [ ] **Step 3: Implement release workflow**

Use BuildKit for `linux/amd64`, push to GHCR, resolve registry digest from build metadata, generate SBOM/provenance, sign with keyless Cosign under the protected environment, attest the image, pull the exact digest, and rerun `verify-image.sh`.

- [ ] **Step 4: Implement atomic catalogue recording**

`record-release.mjs` accepts only verified workflow output, writes `{registry, repository, digest}` under `ghcr-public`, preserves `self-managed`, and refuses a digest not matching `sha256:[a-f0-9]{64}`. It creates a release branch/PR rather than pushing directly to main.

- [ ] **Step 5: Configure package visibility and release protection**

After the first successful gated release, change only the GHCR package visibility to public. Keep the source repository private. Record the package URL, release run, digest, signature, attestation, and SBOM references in the PR.

- [ ] **Step 6: Verify release from an unauthenticated pull context**

Run on a clean host/session:

```bash
docker pull ghcr.io/oxy7o/platform-ci-php@sha256:${RELEASE_DIGEST}
```

Here `RELEASE_DIGEST` is read from the merged catalogue entry, not typed manually. Expected: pull succeeds without registry credential and doctor verification passes.

- [ ] **Step 7: Commit release system**

```bash
git add .github scripts tests catalogue README.md docs/OPERATIONS.md
git commit -m "feat: release signed runtime images to public GHCR"
```

### Task 5: Registry Mandiri Mirror Contract

**Files:**
- Create: `.github/workflows/mirror.yml`
- Create: `scripts/verify-mirror.mjs`
- Create: `tests/mirror-contract.test.mjs`
- Create: `docs/REGISTRY-MIGRATION.md`

**Interfaces:**
- Consumes: approved GHCR digest and protected destination registry configuration.
- Produces: verified `self-managed` catalogue location; does not change active consumer automatically.

- [ ] **Step 1: Write failing mirror contract tests**

Assert mirror workflow is manual, protected, accepts a logical ID rather than arbitrary source image, copies by digest, verifies target platform/digest/signature/SBOM/smoke test, and updates catalogue only through PR. Assert no automatic failover or caller-provided shell/registry command.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/mirror-contract.test.mjs`  
Expected: FAIL because mirror workflow is absent.

- [ ] **Step 3: Implement mirror and verification flow**

Resolve source from catalogue, authenticate only to the protected destination, copy with a registry-native digest-preserving tool, verify manifest and content, sign/attest the destination reference, then record the destination through `record-release.mjs` in mirror mode.

- [ ] **Step 4: Document cutover and rollback**

Document: prerequisite connectivity, certificate trust, credential ownership, mirror evidence, consumer PR generation, canary, rollback to the previous literal GHCR digest, and prohibition on silent failover.

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add .github scripts tests docs/REGISTRY-MIGRATION.md
git commit -m "feat: support verified self-managed registry mirrors"
```

### Task 6: Expand Approved PHP Matrix

**Files:**
- Modify: `catalogue/php-ci.json`
- Modify: `images/php-ci/Dockerfile`
- Modify: `tests/catalogue.test.mjs`
- Modify: `tests/php-image-contract.test.mjs`
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Produces logical IDs `php-ci/8.2`, `php-ci/8.3`, `php-ci/8.4`, and `php-ci/8.5` with independent digests and lifecycle.

- [ ] **Step 1: Add failing matrix tests for PHP 8.2, 8.4, and 8.5**

Expected base digests are those already approved in the design branch. Tests must assert each lane gets the correct doctor PHP minor and cannot reuse another lane's release digest.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`  
Expected: FAIL because only PHP 8.3 exists.

- [ ] **Step 3: Add catalogue entries and matrix build**

Lifecycle image untuk kloter ini: PHP 8.3 `canonical`, PHP 8.2 `maintenance`,
serta PHP 8.4 dan 8.5 `maintenance` sampai keputusan canonical berikutnya.
Lifecycle aplikasi tetap ditentukan oleh technology capability catalogue dan
tidak boleh disimpulkan dari lifecycle image. Build success tidak menghasilkan
klaim operational verification.

- [ ] **Step 4: Build and verify all four lanes locally/CI**

Run: `npm test && npm run validate:catalogue`  
Expected: all doctor, extension, fixture, security, and prohibited-content tests pass.

- [ ] **Step 5: Release and merge catalogue digests**

Release each lane through Task 4 gates. Merge the generated catalogue PR only after pull-by-digest verification for all lanes.

- [ ] **Step 6: Commit matrix expansion**

```bash
git add catalogue images tests .github
git commit -m "feat: release supported PHP CI image matrix"
```

### Task 7: Integrate Controlled Images into `platform-workflow`

**Files:**
- Modify in `platform-workflow`: `.github/workflows/ci-family-php.yml`
- Modify: `.github/workflows/ci-profile-php-laravel.yml`
- Modify: `.github/workflows/ci-compatibility-php-laravel.yml`
- Create: `actions/verify-runtime-image/action.yml`
- Create: `scripts/verify-runtime-image.sh`
- Modify: `tests/workflow-contract.test.mjs`
- Modify: `docs/RUNNER-CACHE-OPERATIONS.md`
- Modify: `docs/LARAVEL-CI-BLUEPRINT.md`

**Interfaces:**
- Consumes: exact GHCR references from the merged runtime image release catalogue.
- Produces: Laravel jobs with no `setup-php` and a doctor check before source-dependent execution.

- [ ] **Step 1: Write failing consumer tests**

Tests must assert every PHP workflow image equals a merged catalogue location, `setup-php` is absent, doctor verification is the first runtime step after checkout/contract validation, named Composer cache volumes remain version-isolated, and no caller input controls registry/image/cache key.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/workflow-contract.test.mjs`  
Expected: FAIL because workflows still use official PHP images and `setup-php`.

- [ ] **Step 3: Implement doctor action and literal digest mapping**

Doctor action compares logical ID, PHP minor, Composer major, Node major, architecture, and required extensions with the workflow's controlled expectation. A mismatch exits as `platform-failure` before dependency installation.

- [ ] **Step 4: Remove `setup-php` and update all PHP workflows**

Replace official image expressions with catalogue-derived GHCR digest expressions committed literally in YAML. Preserve read-only permissions, runner labels, persistent cache mounts, artifact behavior, and evidence normalization.

- [ ] **Step 5: Run the complete platform test suite**

Run:

```bash
npm test
npm run validate:repository
git diff --check
```

Expected: all existing PHP, Go, and .NET regression tests pass; no workflow references `setup-php`.

- [ ] **Step 6: Commit integration**

```bash
git add .github actions scripts tests docs
git commit -m "feat(ci): consume verified platform PHP runtime images"
```

### Task 8: Runner Warmup dan Example Laravel Pilot

**Files:**
- Modify in `platform-workflow`: `scripts/maintain-runner-cache.sh`
- Modify: `docs/RUNNER-CACHE-OPERATIONS.md`
- Modify in `example-app-laravel`: `.github/workflows/ci.yml`
- Modify: `.github/workflows/validate-demo-repository.yml`
- Modify: `repository-policy.json`
- Modify: `tests/thin-caller.test.mjs`
- Create: `docs/results/platform-runtime-image-pilot.json`

**Interfaces:**
- Consumes: released platform workflow SHA and runtime image catalogue digests.
- Produces: actual runner evidence comparing cold and warm runs.

- [ ] **Step 1: Write failing warmup and example contract tests**

Assert maintenance pre-pulls every active GHCR digest, never runs global image/volume deletion, example caller pins the new platform workflow SHA, and validator uses the controlled PHP image with persistent Composer/npm volumes.

- [ ] **Step 2: Run tests and verify RED**

Run platform and example targeted tests. Expected: FAIL because references still point to the pre-image workflow.

- [ ] **Step 3: Update maintenance and example references**

Render approved image references from the merged runtime catalogue, update immutable workflow SHA, preserve read-only permissions, and remove any remaining `setup-php` step from example-owned jobs.

- [ ] **Step 4: Execute cold-cache pilot**

Delete only the named Composer/npm volumes for this pilot and remove only the exact approved image digests from the dedicated runner. Run CI once and record run/job IDs, timestamps, image pull duration, dependency duration, conclusions, artifact digest, workflow SHA, image logical ID/release/digest, and runner name.

- [ ] **Step 5: Execute warm-cache pilot**

Rerun the same commit without cache deletion. Assert all required checks and artifact digest are equivalent; record duration differences without defining a performance SLA from one sample.

- [ ] **Step 6: Test cache recovery**

Remove only one version-specific Composer volume, rerun the affected lane, and assert lockfile installation reconstructs cache and produces the same normalized result.

- [ ] **Step 7: Record Safe evidence**

Write `docs/results/platform-runtime-image-pilot.json` without secret, raw environment value, registry credential, or host filesystem path. Mark `operationallyVerified: true` only if every required lane passes.

- [ ] **Step 8: Run final verification and commit**

```bash
npm test
npm run validate:repository
git diff --check
git add .github repository-policy.json tests docs/results
git commit -m "test: verify controlled PHP runtime images on platform runner"
```

### Task 9: Review, Release, dan Governance Traceability

**Files:**
- Modify in `platform-runtime-images`: `CHANGELOG.md`, `README.md`
- Modify in `platform-workflow`: `CHANGELOG.md`, `docs/GOVERNANCE-TRACEABILITY-MATRIX.md`, `docs/TECHNOLOGY-SUPPORT-AND-CAPABILITY-MATRIX.md`
- Modify in `example-app-laravel`: `CHANGELOG.md`, `README.md`

**Interfaces:**
- Consumes: merged image catalogue, actual pilot evidence, and passing PR checks.
- Produces: released image factory and updated workflow/example release references without overclaiming compliance.

- [ ] **Step 1: Perform final security and scope review**

Review permissions, public package visibility, source repository privacy, signatures, attestations, SBOM, scan decision, digest mapping, runner cache boundaries, evidence redaction, and absence of deployment/application-runtime scope.

- [ ] **Step 2: Verify all repositories are clean and checks pass**

Run each repository's complete test/validator suite and `git diff --check`. Review every PR check and ensure no queued/stale run is mistaken for a pass.

- [ ] **Step 3: Release in dependency order**

Order: runtime image release and catalogue → platform-workflow release → example-app-laravel pilot/release → governance traceability update. Every downstream repository pins an immutable upstream digest/SHA.

- [ ] **Step 4: Update traceability without compliance overclaim**

Record implementation and actual verification separately. Organization compliance remains pending until the organization assessment and remediation process is completed.

- [ ] **Step 5: Commit documentation and release records**

Use repository-specific conventional commits, then create concise PR/release notes covering controlled runtime, cache behavior, security evidence, supported PHP lanes, and registry portability.
