# Laravel Container-Host CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun dan membuktikan golden path Laravel CD yang menerbitkan OCI image immutable ke private GHCR lalu melakukan deployment development ke Docker Compose pada VM dengan health verification, safe evidence, dan LKG rollback.

**Architecture:** `platform-workflow` memiliki kontrak, action terkontrol, dan reusable workflow; repository aplikasi hanya menyediakan thin caller, Dockerfile, serta Compose manifest. OCI image dibangun satu kali, dipromosikan berdasarkan digest, dan di-deploy melalui GitHub Environment `development` serta akun SSH terbatas.

**Tech Stack:** GitHub Actions, TypeScript/Node.js 24 actions, JSON Schema Draft 2020-12, Docker BuildKit/Buildx, private GHCR, Docker Compose v2, OpenSSH, Laravel `/up`, Node test runner, ESLint, ShellCheck, actionlint.

**Spec:** `docs/superpowers/specs/2026-09-13-laravel-container-host-cd-design.md`

## Global Constraints

- Acuan governance adalah `platform-governance@v1.5.0`.
- Tahap ini hanya mengaktifkan deployment environment `development` ke Docker Compose pada VM.
- Registry default adalah private GHCR; registry alternatif harus dapat ditambahkan tanpa mengubah deployment contract.
- Deployment identity wajib cocok dengan pola `^sha256:[a-f0-9]{64}$`; mutable tag seperti `latest` ditolak.
- OCI image dibangun satu kali dan tidak dibangun ulang saat promotion atau deployment.
- Thin caller tidak menerima atau menjalankan arbitrary shell command.
- Database migration automation, staging, production, dan Kubernetes adapter berada di luar scope.
- Secret hanya tersedia pada deployment job dan tidak boleh masuk artifact, log terstruktur, output, atau safe evidence.
- Semua third-party action dan reusable workflow dipin ke full commit SHA.
- Production tidak boleh dipicu oleh merge ke `main` atau pembuatan tag.
- Status tetap `pilot`; actual run bukan klaim `operationally-compliant`.

## Struktur file

### `platform-workflow`

- `contracts/oci-build-input.schema.json`: kontrak publication OCI Laravel.
- `contracts/container-host-deployment.schema.json`: kontrak deployment VM/Compose.
- `contracts/deployment-result.schema.json`: schema safe terminal result.
- `src/contracts/deployment-types.ts`: tipe input dan hasil deployment.
- `src/validate-oci-build-input.ts`: validator build contract dan canonical digest input.
- `src/validate-container-host-deployment.ts`: validator target, path, image, health, dan LKG.
- `src/generate-deployment-evidence.ts`: pembentuk safe evidence allowlist.
- `scripts/container-host-deploy.sh`: executor idempotent SSH/Compose/health/rollback.
- `actions/validate-oci-build/action.yml`: wrapper action validator OCI.
- `actions/validate-container-host-deployment/action.yml`: wrapper action validator deployment.
- `actions/generate-deployment-evidence/action.yml`: wrapper evidence sanitizer.
- `actions/container-host-deploy/action.yml`: wrapper controlled executor.
- `.github/workflows/build-oci-php-laravel.yml`: reusable OCI publication workflow.
- `.github/workflows/deploy-container-host-development.yml`: reusable development deployment.
- `docs/deployment/container-host-development.md`: consumer guide dan konfigurasi operator.
- `docs/TRACEABILITY.md`: mapping capability CD ke governance control.
- `catalogue/technology-stack.json`: capability dan resource reference baru.
- `tests/oci-build-contract.test.mjs`: kontrak publication.
- `tests/container-host-deployment-contract.test.mjs`: kontrak deployment.
- `tests/deployment-evidence.test.mjs`: evidence sanitization.
- `tests/container-host-deploy.test.mjs`: executor fixture tests.
- `tests/deployment-workflow.test.mjs`: workflow permission, trigger, pin, dan environment tests.
- `tests/fixtures/deployment/`: contract, Compose, dan fake-command fixtures.

### `example-app-laravel`

- `Dockerfile`: OCI application image deterministic.
- `.dockerignore`: boundary build context.
- `deploy/compose.yaml`: baseline web service menggunakan `APP_IMAGE` berbasis digest.
- `.github/workflows/publish-oci.yml`: thin caller publication.
- `.github/workflows/deploy-development.yml`: thin caller development deployment.
- `tests/deployment-contract.test.mjs`: policy dan thin caller tests.
- `README.md` dan `CHANGELOG.md`: onboarding, pilot scope, dan release evidence.

---

### Task 1: Kontrak OCI Build Laravel

**Files:**
- Create: `contracts/oci-build-input.schema.json`
- Create: `src/validate-oci-build-input.ts`
- Create: `actions/validate-oci-build/action.yml`
- Create: `tests/oci-build-contract.test.mjs`
- Create: `tests/fixtures/contracts/valid-oci-build-laravel.json`
- Modify: `src/contracts/types.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: repository checkout, source SHA, image repository, Dockerfile path, build context, platform list, artifact ID.
- Produces: `validateOciBuildInput(input: unknown): OciBuildInput` dan action output `contract-digest`.

- [ ] **Step 1: Write the failing contract tests**

Test harus membuktikan valid contract diterima dan nilai berikut ditolak: unknown
field, tag pada `imageRepository`, path absolut, traversal, Dockerfile di luar build
context, arbitrary build argument, malformed SHA, serta profile selain
`php-laravel`.

```js
test("accepts the governed Laravel OCI build contract", () => {
  const result = validate(validInput);
  assert.equal(result.profileKey, "php-laravel");
  assert.equal(result.platforms[0], "linux/amd64");
});

test("rejects mutable image identityContext and caller commands", () => {
  assert.throws(() => validate({...validInput, imageRepository: "ghcr.io/oxy7o/app:latest"}));
  assert.throws(() => validate({...validInput, buildCommand: "docker build ."}));
});
```

- [ ] **Step 2: Run the tests and verify red state**

Run: `npm run build && node --test tests/oci-build-contract.test.mjs`

Expected: FAIL because schema, validator, fixture, and action do not exist.

- [ ] **Step 3: Implement the schema and typed validator**

Contract fields harus tepat: `schemaVersion`, `governanceVersion`,
`catalogueVersion`, `profileKey`, `sourceSha`, `artifactId`, `imageRepository`,
`dockerfilePath`, `contextPath`, `platforms`, `retentionDays`, dan `evidenceMode`.
Tidak ada caller-provided command atau free-form build arguments.

- [ ] **Step 4: Add the local action wrapper and bundle target**

Action menerima satu input JSON, menjalankan bundled validator, dan menghasilkan
canonical JSON serta SHA-256 contract digest. Tambahkan bundle ke `bundle:all`.

- [ ] **Step 5: Run focused and repository tests**

Run: `npm run bundle:all && npm test && npm run lint && npm run typecheck`

Expected: seluruh test lulus dan generated `dist` hanya berubah pada bundle baru.

- [ ] **Step 6: Commit**

```bash
git add contracts src actions tests package.json package-lock.json dist
git commit -m "feat: add governed Laravel OCI build contract"
```

### Task 2: Reusable OCI Publication Workflow

**Files:**
- Create: `.github/workflows/build-oci-php-laravel.yml`
- Create: `tests/oci-publication-workflow.test.mjs`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Consumes: Task 1 canonical OCI contract; caller checkout; GitHub token with scoped package write.
- Produces: outputs `image-reference`, `image-digest`, `artifact-id`, `source-sha`, `provenance-reference`, `sbom-reference`, dan `evidence-metadata`.

- [ ] **Step 1: Write failing workflow-structure tests**

Assert workflow memakai `workflow_call`, default `contents: read`, publication job
menambahkan hanya `packages: write` dan `id-token: write`, memvalidasi contract,
mem-pin checkout/buildx/login/build-push/provenance actions ke full SHA, serta tidak
menerima secret inheritance atau arbitrary command.

- [ ] **Step 2: Run the focused test and verify red state**

Run: `node --test tests/oci-publication-workflow.test.mjs`

Expected: FAIL because workflow does not exist.

- [ ] **Step 3: Implement build-once publication**

Workflow harus melakukan checkout, contract validation, GHCR login, Buildx build,
push, digest capture, provenance/SBOM generation, dan safe output export. Image
tag boleh menjadi discovery alias, tetapi seluruh downstream output dan evidence
harus menggunakan digest canonical.

- [ ] **Step 4: Extend repository validation**

Validator harus memeriksa permission, full-SHA pins, output wajib, tidak ada
`pull_request_target`, tidak ada `secrets: inherit`, dan tidak ada deployment job.

- [ ] **Step 5: Run validation**

Run: `npm test && npm run validate:repository && npx actionlint`

Expected: seluruh checks lulus.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/build-oci-php-laravel.yml tests scripts
git commit -m "feat: publish immutable Laravel OCI images"
```

### Task 3: Container-Host Deployment Contract

**Files:**
- Create: `contracts/container-host-deployment.schema.json`
- Create: `src/contracts/deployment-types.ts`
- Create: `src/validate-container-host-deployment.ts`
- Create: `actions/validate-container-host-deployment/action.yml`
- Create: `tests/container-host-deployment-contract.test.mjs`
- Create: `tests/fixtures/deployment/valid-development.json`

**Interfaces:**
- Consumes: OCI digest output dari Task 2, target ID dari approved catalogue, and LKG digest.
- Produces: `validateContainerHostDeployment(input: unknown): ContainerHostDeployment` dan output `contract-digest`.

- [ ] **Step 1: Write failing positive and negative tests**

Valid contract menggunakan environment `development`, target ID
`laravel-development-container-host`, Compose path `deploy/compose.yaml`, service
`web`, health path `/up`, fixed timeout/retry bounds, image digest, dan LKG digest.
Tests harus menolak hostname/IP, username, secret-like key, mutable tag, command,
absolute/traversal path, unknown service, unsupported environment, serta target ID
yang tidak cocok dengan development.

- [ ] **Step 2: Verify tests fail**

Run: `npm run build && node --test tests/container-host-deployment-contract.test.mjs`

Expected: FAIL because deployment contract is not implemented.

- [ ] **Step 3: Implement strict schema and semantic checks**

Schema membatasi field, enum, pattern, timeout 10–300 detik, retry 1–30, serta
service name. Semantic validator memastikan image reference berakhiran digest,
LKG berbeda atau sama secara valid, dan target/environment mapping tepat.

- [ ] **Step 4: Add action wrapper and bundle**

Action menghasilkan canonical contract dan digest; error message hanya menyebut
JSON pointer serta policy category.

- [ ] **Step 5: Run focused and full tests**

Run: `npm run bundle:all && npm test && npm run lint && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add contracts src actions tests package.json package-lock.json dist
git commit -m "feat: add container-host deployment contract"
```

### Task 4: Safe Deployment Evidence

**Files:**
- Create: `contracts/deployment-result.schema.json`
- Create: `src/generate-deployment-evidence.ts`
- Create: `actions/generate-deployment-evidence/action.yml`
- Create: `tests/deployment-evidence.test.mjs`

**Interfaces:**
- Consumes: validated deployment contract plus controlled executor result.
- Produces: `generateDeploymentEvidence(input: DeploymentEvidenceInput): DeploymentResult` dan action output `evidence-json`.

- [ ] **Step 1: Write failing evidence tests**

Tests memastikan output hanya memuat attempt ID, repository, environment, target
ID, source/workflow SHA, artifact ID, image digest, authorization reference,
timestamps, terminal status, failure category, health result, LKG, rollback result,
dan governance references. Nested token, key, password, hostname, IP, username,
raw command, atau environment value harus ditolak.

- [ ] **Step 2: Verify tests fail**

Run: `npm run build && node --test tests/deployment-evidence.test.mjs`

- [ ] **Step 3: Implement allowlist-only evidence generator**

Gunakan reconstruction dari typed fields; jangan melakukan clone lalu menghapus
denylisted keys. Validate final result against `deployment-result.schema.json`.

- [ ] **Step 4: Add action wrapper and bundle target**

Action menerima controlled JSON dan mengeluarkan compact safe JSON tanpa raw log.

- [ ] **Step 5: Run verification and commit**

Run: `npm run bundle:all && npm test && npm run lint && npm run typecheck`

```bash
git add contracts src actions tests package.json package-lock.json dist
git commit -m "feat: generate safe deployment evidence"
```

### Task 5: Controlled Docker Compose Executor

**Files:**
- Create: `scripts/container-host-deploy.sh`
- Create: `actions/container-host-deploy/action.yml`
- Create: `tests/container-host-deploy.test.mjs`
- Create: `tests/fixtures/deployment/bin/ssh`
- Create: `tests/fixtures/deployment/bin/scp`
- Create: `tests/fixtures/deployment/compose.yaml`

**Interfaces:**
- Consumes: canonical deployment contract, `DEPLOY_SSH_PRIVATE_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_TARGET_HOST`, `DEPLOY_TARGET_USER`, and registry pull credential from GitHub Environment.
- Produces: controlled result JSON containing terminal status, active digest, health result, previous/resulting LKG, and rollback outcome.

- [ ] **Step 1: Write failing executor fixture tests**

Use fake `ssh` and `scp` binaries to record argv without network access. Cover
successful digest deployment, already-active idempotence, pull failure, health
failure with successful LKG rollback, rollback failure, known-host absence,
cleanup on every exit, and proof that secret values never appear in stdout/result.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/container-host-deploy.test.mjs`

Expected: FAIL because executor and action do not exist.

- [ ] **Step 3: Implement controlled executor**

Script memakai `set -Eeuo pipefail`, private temporary directory, trap cleanup,
`BatchMode=yes`, strict known-host file, allowlisted remote wrapper, Compose config
validation, pull by digest, idempotent up, container digest inspection, bounded
health retries, and LKG recovery. Jangan menggunakan `eval`, inline remote shell
dari caller, `StrictHostKeyChecking=no`, atau mencetak environment.

- [ ] **Step 4: Add composite action wrapper**

Wrapper hanya memetakan typed inputs dan environment secret ke script. Secret
inputs tidak diekspos sebagai output.

- [ ] **Step 5: Run ShellCheck and tests**

Run: `shellcheck scripts/container-host-deploy.sh && npm test && npm run validate:repository`

- [ ] **Step 6: Commit**

```bash
git add scripts actions tests
git commit -m "feat: deploy container hosts with LKG recovery"
```

### Task 6: Reusable Development Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-container-host-development.yml`
- Create: `tests/deployment-workflow.test.mjs`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Consumes: deployment contract JSON, image digest, artifact ID, source SHA, LKG reference, and environment-scoped secrets.
- Produces: `deployment-attempt-id`, `terminal-status`, `active-digest`, `rollback-status`, dan `evidence-metadata`.

- [ ] **Step 1: Write failing workflow policy tests**

Assert `workflow_call`, job environment `development`, explicit secret mapping,
`contents: read`, `packages: read`, no `packages: write`, concurrency based on
caller repository plus development, `cancel-in-progress: false`, full-SHA action
pins, and no production/staging value.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/deployment-workflow.test.mjs`

- [ ] **Step 3: Implement reusable workflow**

Urutan job: validate contract, authorize environment, execute controlled action,
generate evidence under `if: always()`, upload safe evidence, and export terminal
outputs. Executor hanya berjalan setelah upstream image/artifact identity cocok.

- [ ] **Step 4: Extend repository validator**

Tambahkan checks untuk environment, permission, concurrency, secret mapping,
evidence-on-failure, immutable pins, dan larangan production trigger.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run lint && npm run typecheck && npm run validate:repository && npx actionlint`

```bash
git add .github/workflows/deploy-container-host-development.yml tests scripts
git commit -m "feat: add governed development deployment workflow"
```

### Task 7: Documentation, Catalogue, and Traceability

**Files:**
- Create: `docs/deployment/container-host-development.md`
- Modify: `docs/TRACEABILITY.md`
- Modify: `catalogue/technology-stack.json`
- Modify: `docs/profiles/php-laravel/README.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `tests/technology-catalogue-navigation.test.mjs`
- Modify: `tests/documentation-readability.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–6 public workflows, actions, schemas, outputs, and constraints.
- Produces: operator/developer guide and machine-readable capability references.

- [ ] **Step 1: Write failing navigation and traceability tests**

Tests require links from README/profile/catalogue to OCI publication, container-host
deployment, schemas, inputs, outputs, environment setup, secret names, UI/manual
tasks, troubleshooting, rollback, and P04/P06/P07/P08/P09/P10 controls.

- [ ] **Step 2: Verify documentation tests fail**

Run: `node --test tests/technology-catalogue-navigation.test.mjs tests/documentation-readability.test.mjs`

- [ ] **Step 3: Write the operator and developer documentation**

Dokumentasikan pembagian otomatis/manual, GitHub Environment setup, SSH deploy
user constraints, known hosts, private GHCR access, Compose contract, `/up`, LKG,
failure categories, safe evidence, and explicit pilot limitations.

- [ ] **Step 4: Update machine catalogue and traceability matrix**

Tambahkan `oci-publication` dan `container-host-development` sebagai capability
pilot. Status governance tetap terpisah dari availability dan actual verification.

- [ ] **Step 5: Run repository verification and commit**

Run: `npm test && npm run validate:repository && git diff --check`

```bash
git add README.md CHANGELOG.md docs catalogue tests
git commit -m "docs: publish Laravel container-host CD guidance"
```

### Task 8: Example Laravel OCI and Thin Callers

**Files:**
- Create in `example-app-laravel`: `Dockerfile`
- Create in `example-app-laravel`: `.dockerignore`
- Create in `example-app-laravel`: `deploy/compose.yaml`
- Create in `example-app-laravel`: `.github/workflows/publish-oci.yml`
- Create in `example-app-laravel`: `.github/workflows/deploy-development.yml`
- Create in `example-app-laravel`: `tests/deployment-contract.test.mjs`
- Modify in `example-app-laravel`: `README.md`
- Modify in `example-app-laravel`: `CHANGELOG.md`
- Modify in `example-app-laravel`: `package.json`

**Interfaces:**
- Consumes: immutable workflow SHAs produced by platform-workflow Tasks 2 and 6.
- Produces: buildable Laravel OCI context, Compose fixture, publication caller, and development deployment caller.

- [ ] **Step 1: Write failing example policy tests**

Assert Dockerfile uses controlled PHP runtime base pinned by digest, `.dockerignore`
excludes environment/vendor/VCS material, Compose requires `APP_IMAGE` and contains
no credential, callers are thin/full-SHA/read-only by default, publication has
explicit package permission, deployment maps secrets explicitly, and main/tag do
not deploy production.

- [ ] **Step 2: Verify tests fail**

Run from example repository: `npm test`

- [ ] **Step 3: Implement deterministic OCI context and Compose manifest**

Dockerfile installs frozen Composer dependencies in builder stage, copies only
runtime-required files, runs as non-root, exposes application port, and defines
healthcheck `/up`. Compose image is `${APP_IMAGE:?APP_IMAGE is required}` and does
not build locally.

- [ ] **Step 4: Add immutable thin callers**

Publication caller passes only the governed OCI contract. Deployment caller runs
only after the publication/promotion source has produced approved image digest and
uses GitHub Environment `development` through the reusable workflow.

- [ ] **Step 5: Update onboarding docs and run verification**

Run: `npm test && node scripts/validate-repository.mjs && npm audit --audit-level=high`

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore deploy .github/workflows tests README.md CHANGELOG.md package.json package-lock.json
git commit -m "feat: add Laravel container-host deployment example"
```

### Task 9: Pull Requests and Actual Development Pilot

**Files:**
- Modify only if actual evidence reveals a defect: files owned by the failing component.
- Record release evidence in `example-app-laravel` documentation after all checks pass.

**Interfaces:**
- Consumes: reviewed platform-workflow and example branches plus configured GitHub Environment/VM.
- Produces: merged immutable SHAs, actual run URLs, artifact/image digest, deployment result, and pilot evidence.

- [ ] **Step 1: Run final local verification in both repositories**

Platform workflow:

```bash
npm ci
npm run bundle:all
npm test
npm run lint
npm run typecheck
npm run validate:repository
npm audit --audit-level=high
git diff --check
```

Example Laravel:

```bash
npm ci
npm test
node scripts/validate-repository.mjs
npm audit --audit-level=high
git diff --check
```

- [ ] **Step 2: Create and review the platform-workflow PR**

PR summary harus menyebut scope development-only, immutable digest, permission,
secret boundary, LKG, tests, dan governance mapping. Merge hanya setelah required
checks lulus.

- [ ] **Step 3: Pin example callers to the merged platform-workflow SHA**

Update test expectation terlebih dahulu, pastikan gagal terhadap pin lama, lalu
update caller dan dokumentasi ke full merge SHA.

- [ ] **Step 4: Configure the development pilot boundary**

Di GitHub Environment `development`, set secret `DEPLOY_SSH_PRIVATE_KEY`,
`DEPLOY_KNOWN_HOSTS`, `DEPLOY_TARGET_HOST`, `DEPLOY_TARGET_USER`, dan scoped GHCR
pull credential. Di VM, sediakan deploy user, allowlisted deployment wrapper,
Docker Engine, Compose v2, application directory, dan firewall path dari runner.
Jangan mencatat nilai secret pada repository atau evidence.

- [ ] **Step 5: Run the actual positive pilot**

Trigger publication from merge to `development`; verify private GHCR digest,
provenance, deployment attempt, active digest, `/up`, safe evidence artifact, dan
LKG update. Seluruh terminal state harus `passed` atau `deployed` sesuai schema.

- [ ] **Step 6: Run controlled negative and rollback pilot**

Gunakan contract fixture dengan health path yang valid secara schema tetapi gagal
di target test. Verify deployment gagal, LKG dipulihkan, active digest kembali ke
LKG, cleanup selesai, dan evidence tidak memuat secret. Negative pilot tidak boleh
menargetkan production.

- [ ] **Step 7: Merge the example PR**

Merge hanya setelah canonical CI, OCI publication validation, deployment policy,
positive pilot, compatibility lanes, repository validation, dan evidence review
lulus.

- [ ] **Step 8: Publish SemVer releases**

Rilis `platform-workflow@v0.7.0` dan `example-app-laravel@v0.5.0` karena capability
CD baru bersifat penambahan minor. Buat changelog profesional yang mencatat boundary,
workflow SHA, OCI digest, actual run, LKG test, known limitations, dan migration
notes. Tag harus menunjuk tepat ke verified `main` commit.

## Definition of Done

- OCI publication dan development deployment tersedia sebagai reusable workflow.
- Container-host contract menolak input bebas dan mutable artifact identity.
- Actual Laravel image dibangun sekali dan di-deploy berdasarkan digest.
- Positive health verification dan negative LKG rollback pilot terbukti.
- Safe evidence tidak memuat secret atau internal network detail.
- Thin caller example tetap kecil dan seluruh implementation pin immutable.
- Documentation, catalogue, dan governance traceability dapat dinavigasi.
- Semua test lokal, GitHub checks, PR review, merge, tag, serta release verification lulus.
