# Go Service Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyediakan reusable CI dan canonical binary artifact untuk profil Go Service, membuktikannya melalui `OXY7O/example-app-go`, lalu mencatat implementation reference immutable di governance.

**Architecture:** `platform-workflow` menambahkan komponen family Go, profile Go Service, binary packager, compatibility lane, dan reusable workflow tanpa mengubah kontrak PHP/Laravel. Consumer private repository menggunakan thin caller yang dipin ke commit SHA; Go 1.26.7 menghasilkan satu artifact Linux `amd64`, sedangkan Go 1.27.0 menjadi blocking artifactless compatibility lane.

**Tech Stack:** TypeScript 6, Node.js 24, GitHub Actions, Go 1.26.7/1.27.0, Bash, AJV JSON Schema, `govulncheck`, tar/gzip, SHA-256.

**Spec:** `docs/superpowers/specs/2026-08-29-go-service-foundation-design.md`

## Global Constraints

- Canonical toolchain adalah Go 1.26.7; compatibility toolchain adalah Go 1.27.0.
- Canonical target hanya `linux/amd64`; `linux/arm64`, OCI image, deployment, dan `go-cli` tetap planned.
- Caller, reusable workflow, dan compatibility workflow hanya memiliki `contents: read`, tanpa secrets, OIDC, environment, atau deployment.
- Caller tidak boleh mengirim command, shell fragment, absolute path, traversal, atau arbitrary cache key.
- Tepat satu canonical archive bernama `<binary-name>_<application-version>_linux_amd64.tar.gz`; compatibility lane tidak menghasilkan artifact.
- Artifact berstatus `ci-qualified`, bukan release-ready atau deployment authorization.
- External action dan consumer reusable workflow harus dipin ke full 40-character commit SHA.
- Status awal family/profile adalah `pilot/not-validated`; `Available` hanya berarti implementasi tersedia.
- Existing PHP/Laravel contracts, workflow behavior, dan evidence history tidak boleh berubah.

---

## File Map

### `platform-workflow`

- `contracts/go-service-input.schema.json`: typed caller contract Go Service.
- `contracts/go-compatibility-catalogue.schema.json`: lane catalogue schema.
- `contracts/go-compatibility-input.schema.json`: compatibility lane contract.
- `src/contracts/go-types.ts`: Go-specific TypeScript interfaces.
- `src/validate-go-service-contract.ts`: caller validation dan digest.
- `src/generate-go-compatibility-matrix.ts`: required lane enforcement dan deterministic ordering.
- `src/build-go-binary-artifact.ts`: deterministic binary archive, manifest, dan digest.
- `src/action-*.ts`: GitHub Action adapters untuk fungsi di atas.
- `scripts/go-family-ci.sh`: module, format, vet, unit, race, coverage, dan vulnerability checks.
- `scripts/go-service-ci.sh`: profile/build validation tanpa arbitrary command.
- `actions/*/action.yml`: private composite atau Node actions.
- `.github/workflows/ci-family-go.yml`: reusable family checks.
- `.github/workflows/ci-compatibility-go-service.yml`: artifactless compatibility workflow.
- `.github/workflows/ci-profile-go-service.yml`: canonical orchestrator dan artifact upload.
- `catalogue/go-service.json`: Go 1.26.7/1.27.0 lane catalogue.
- `docs/profiles/go-service/`: profile landing page dan thin caller guide.
- `tests/go-*.test.mjs`: positive, negative, workflow, artifact, dan navigation tests.

### `example-app-go`

- `cmd/api/main.go`: HTTP service entry point.
- `internal/httpapi/handler.go`: deterministic endpoints.
- `internal/httpapi/handler_test.go`: endpoint and race-safe tests.
- `go.mod`, `go.sum`: frozen module graph, termasuk tool dependency
  `golang.org/x/vuln/cmd/govulncheck@v1.7.0`.
- `.github/workflows/ci.yml`: immutable thin caller.
- `compatibility/go-service.json`: consumer lane catalogue.
- `repository-policy.json`: governance/profile/deployment boundary.
- `docs/`: traceability, pilot guide, schema, example record, dan actual safe evidence.
- `tests/`: repository policy, caller, documentation, dan evidence validation.

### `platform-governance`

- `catalogues/technology-stack/families.json`: Go lifecycle dan implementation reference.
- `catalogues/technology-stack/profiles.json`: Go Service workflow/example references.
- `catalogues/technology-stack/README.md`: status dan navigation.
- `CHANGELOG.md`, `README.md`: release summary.
- `tests/go-service-implementation-map.test.mjs`: no-support-claim mapping test.

---

### Task 1: Go Service Typed Contracts

**Files:**
- Create: `contracts/go-service-input.schema.json`
- Create: `contracts/go-compatibility-catalogue.schema.json`
- Create: `contracts/go-compatibility-input.schema.json`
- Create: `src/contracts/go-types.ts`
- Create: `src/validate-go-service-contract.ts`
- Create: `src/action-validate-go-service-contract.ts`
- Create: `actions/validate-go-service-contract/action.yml`
- Test: `tests/validate-go-service-contract.test.mjs`
- Test fixture: `tests/fixtures/contracts/valid-go-service.json`
- Modify: `package.json`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `validateGoServiceContract(input: unknown): GoServiceInput`
- Produces: `calculateGoServiceContractDigest(input: unknown): string`
- Produces action outputs: `contract-digest`, `profile-key`, `go-version`, `binary-name`

- [ ] **Step 1: Write the failing contract tests**

Test a valid contract with `governanceVersion: "v1.2.0"`, `catalogueVersion: "1.2.0"`, `profileKey: "go-service"`, `goVersion: "1.26.7"`, `modulePath: "github.com/OXY7O/example-app-go"`, `binaryName: "example-api"`, `mainPackage: "./cmd/api"`, `artifactType: "binary"`, `targetOs: "linux"`, `targetArch: "amd64"`, `workingDirectory: "."`, `coverageThreshold: 80`, `retentionDays: 14`, dan `evidenceMode: "safe-metadata"`.

Assert rejection for extra `command`, `../outside`, `/tmp/source`, invalid binary name, unsupported target, Go 1.25, retention outside 1–30, and coverage outside 0–100. Assert digest stability across object key order.

- [ ] **Step 2: Run the focused test and verify red**

Run: `npm run build && node --test tests/validate-go-service-contract.test.mjs`

Expected: FAIL because `lib/validate-go-service-contract.js` does not exist.

- [ ] **Step 3: Implement schemas and validator**

Use AJV draft 2020-12 with `additionalProperties: false`. Restrict `goVersion` to `1.26.7`, `modulePath` to a non-whitespace Go module path, `binaryName` to `^[a-z0-9][a-z0-9-]{1,62}$`, `mainPackage` and `workingDirectory` to relative no-traversal paths, and target to Linux/amd64. Calculate digest from recursively sorted JSON with `sha256:` prefix.

- [ ] **Step 4: Add Node action adapter and manifest**

The adapter parses `contract-json`, validates it, then exposes only the four declared safe outputs. Configure `using: node24` and `main: ../../dist/validate-go-service-contract/index.js`.

- [ ] **Step 5: Update build/bundle and repository validator**

Append the new ncc bundle to `bundle:all`. Require the schema, source, action manifest, and bundled output in `validate-repository.mjs`.

- [ ] **Step 6: Run focused and full contract tests**

Run: `npm run bundle:all && node --test tests/validate-go-service-contract.test.mjs && npm run typecheck && npm run lint`

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add contracts src actions tests package.json scripts dist
git commit -m "feat: add typed Go service caller contract"
```

### Task 2: Go Family and Profile Executors

**Files:**
- Create: `scripts/go-family-ci.sh`
- Create: `scripts/go-service-ci.sh`
- Create: `actions/go-family-check/action.yml`
- Create: `actions/go-service-check/action.yml`
- Create: `tests/go-executor-scripts.test.mjs`
- Create fixtures under: `tests/fixtures/go-service-valid/`, `tests/fixtures/go-missing-sum/`, `tests/fixtures/go-format-failure/`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- `go-family-ci.sh <working-directory> <go-version> <coverage-threshold>`
- `go-service-ci.sh <working-directory> <main-package> <binary-output>`
- Both scripts source `scripts/lib/result.sh` and emit typed result metadata, never evaluate caller strings.

- [ ] **Step 1: Add failing executor tests**

Assert valid fixture passes; missing `go.sum` is `dependency`; dirty `gofmt -l` is `quality`; invalid main package is `configuration`; no script contains `eval`; action inputs do not expose a command field.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/go-executor-scripts.test.mjs`

Expected: FAIL because Go executor scripts do not exist.

- [ ] **Step 3: Implement family checks**

In fixed order run: file presence, `go mod verify`, clean module graph check using copies of `go.mod`/`go.sum`, `gofmt -l`, `go vet ./...`, `go test ./...`, `go test -race ./...`, coverage calculation with `go test -coverprofile`, and `go tool govulncheck ./...` pinned through `golang.org/x/vuln/cmd/govulncheck@v1.7.0`. Emit only safe diagnostics and delete temporary coverage output.

- [ ] **Step 4: Implement profile build validation**

Resolve working directory with realpath containment, validate main package syntax, build with `CGO_ENABLED=0 GOOS=linux GOARCH=amd64`, `-trimpath`, and controlled `-buildvcs=false`; reject symbolic output and confirm executable format.

- [ ] **Step 5: Add composite actions**

Expose only `working-directory`, `go-version`, `coverage-threshold`, `main-package`, and fixed output path inputs. Use `${{ github.action_path }}` for scripts and never caller repository paths for implementation scripts.

- [ ] **Step 6: Run tests and static checks**

Run: `node --test tests/go-executor-scripts.test.mjs && shellcheck scripts/go-family-ci.sh scripts/go-service-ci.sh scripts/lib/result.sh && npm run validate:repository`

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts actions tests
git commit -m "feat: add governed Go family and service checks"
```

### Task 3: Deterministic Go Binary Artifact

**Files:**
- Create: `contracts/go-binary-artifact-input.schema.json`
- Create: `contracts/go-binary-manifest.schema.json`
- Create: `src/build-go-binary-artifact.ts`
- Create: `src/action-build-go-binary-artifact.ts`
- Create: `actions/build-go-binary-artifact/action.yml`
- Create: `tests/build-go-binary-artifact.test.mjs`
- Create fixture: `tests/fixtures/go-binary-safe/example-api`
- Modify: `package.json`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `buildGoBinaryArtifact(input: GoBinaryArtifactInput): Promise<GoBinaryArtifactOutput>`
- Outputs: `artifact-id`, `artifact-name`, `artifact-path`, `digest`, `manifest-path`, `manifest-digest`, `readiness`

- [ ] **Step 1: Add failing artifact tests**

Assert two builds from identical executable bytes and metadata produce identical archive and manifest digests. Assert exact archive name `example-api_0.1.0_linux_amd64.tar.gz`, one executable plus one manifest, normalized uid/gid/mode/mtime, and rejection of symlink, `.env`, private-key material, invalid SHA, invalid semantic version, or architecture other than amd64.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/build-go-binary-artifact.test.mjs`

Expected: FAIL because the builder module does not exist.

- [ ] **Step 3: Implement deterministic packaging**

Validate input with AJV, copy only the verified executable, generate a sorted manifest, normalize archive metadata, gzip deterministically, calculate SHA-256 digests, and return detached output values. Do not reuse the PHP source packager because Go packages a verified binary rather than source.

- [ ] **Step 4: Add Node action and bundle**

Use `node24`, add `bundle:all` entry, and require bundled output in repository validation.

- [ ] **Step 5: Run artifact and regression tests**

Run: `npm run bundle:all && node --test tests/build-go-binary-artifact.test.mjs tests/build-artifact.test.mjs && npm run typecheck && npm run lint`

Expected: Go and PHP artifact tests pass.

- [ ] **Step 6: Commit**

```bash
git add contracts src actions tests package.json scripts dist
git commit -m "feat: build deterministic Go binary artifacts"
```

### Task 4: Go Compatibility Matrix and Artifactless Workflow

**Files:**
- Create: `catalogue/go-service.json`
- Create: `src/generate-go-compatibility-matrix.ts`
- Create: `src/action-generate-go-compatibility-matrix.ts`
- Create: `actions/generate-go-compatibility-matrix/action.yml`
- Create: `.github/workflows/ci-compatibility-go-service.yml`
- Create: `tests/generate-go-compatibility-matrix.test.mjs`
- Create: `tests/go-compatibility-workflow-contract.test.mjs`
- Modify: `package.json`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `generateGoCompatibilityMatrix(catalogue, options): {include: GoCompatibilityInput[]}`
- Required compatibility lane: `go-1.27.0-linux-amd64`, blocking, eligible, execution mode `compatibility-only`, artifact `false`.

- [ ] **Step 1: Add failing matrix and workflow tests**

Test missing required lane, duplicate ID, contradictory ID/version/target, nonblocking required lane, artifact-enabled compatibility lane, absolute catalogue path, traversal, and symlink escape. Assert deterministic output contains only Go 1.27.0 and the workflow contains no upload-artifact, environment, secrets, OIDC, or deployment text.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/generate-go-compatibility-matrix.test.mjs tests/go-compatibility-workflow-contract.test.mjs`

Expected: FAIL because generator and workflow do not exist.

- [ ] **Step 3: Implement catalogue and generator**

Validate exact identity `go-${goVersion}-linux-amd64`, require Go 1.27.0 lane, force blocking true and artifact false, reject duplicates, and resolve catalogue path using repository and target realpaths.

- [ ] **Step 4: Implement compatibility workflow**

Checkout caller source, configure exact Go version through SHA-pinned `actions/setup-go`, validate compatibility contract, execute Go family/profile checks, normalize results, and expose readiness, failure category, contract digest, module digest, and safe evidence. Do not upload files.

- [ ] **Step 5: Bundle and run tests**

Run: `npm run bundle:all && node --test tests/generate-go-compatibility-matrix.test.mjs tests/go-compatibility-workflow-contract.test.mjs && npm run validate:repository`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add catalogue contracts src actions .github tests package.json scripts dist
git commit -m "feat: add artifactless Go compatibility workflow"
```

### Task 5: Canonical Go Service Reusable Workflow

**Files:**
- Create: `.github/workflows/ci-family-go.yml`
- Create: `.github/workflows/ci-profile-go-service.yml`
- Create: `tests/go-workflow-contract.test.mjs`
- Modify: `contracts/failure-taxonomy.json`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Workflow inputs match Task 1 contract.
- Workflow outputs: `readiness`, `failure-category`, `artifact-id`, `artifact-name`, `artifact-digest`, `manifest-digest`, `evidence-metadata`.

- [ ] **Step 1: Add failing workflow tests**

Assert `workflow_call`, read-only permissions, exact Go 1.26.7 canonical version, Go 1.27.0 compatibility call, full SHA pins, one upload-artifact step, no secrets/deployment, exact output names, and failure categories from the specification.

- [ ] **Step 2: Verify red**

Run: `node --test tests/go-workflow-contract.test.mjs`

Expected: FAIL because workflows do not exist.

- [ ] **Step 3: Capture immutable implementation SHA**

Run: `git rev-parse HEAD`

Store the returned 40-character SHA as `GO_IMPLEMENTATION_SHA`. Verify with `test "${#GO_IMPLEMENTATION_SHA}" -eq 40`. This SHA is the immutable pin for private actions introduced in Tasks 1–4.

- [ ] **Step 4: Implement family and profile workflows**

Orchestrate validation → family checks → profile checks → binary packaging → one artifact upload → normalization. Use `GO_IMPLEMENTATION_SHA` for every internal `OXY7O/platform-workflow/actions/...` reference. Add compatibility as a separate required job that cannot affect artifact contents.

- [ ] **Step 5: Run workflow and full regression tests**

Run: `npm test && npm run lint && npm run typecheck && npm run validate:repository && git diff --check`

Expected: all tests pass; existing PHP workflow tests remain green.

- [ ] **Step 6: Commit**

```bash
git add .github contracts tests scripts
git commit -m "feat: orchestrate reusable Go service CI"
```

### Task 6: Go Service Catalogue and Documentation Portal

**Files:**
- Create: `docs/profiles/go-service/README.md`
- Create: `docs/profiles/go-service/THIN-CALLER.md`
- Modify: `docs/profiles/README.md`
- Modify: `README.md`
- Modify: `catalogue/technology-stack.json`
- Modify: `tests/documentation-readability.test.mjs`
- Modify: `tests/technology-catalogue-navigation.test.mjs`

**Interfaces:**
- Catalogue `go-service.availability` becomes `available`, lifecycle stays `pilot`, compatibility stays `not-validated`.
- Workflow link targets `.github/workflows/ci-profile-go-service.yml`; example link remains null until repository exists.

- [ ] **Step 1: Add failing navigation tests**

Assert root catalogue lists Go Service as Available with profile link, keeps Go CLI Planned without executable link, explains Available versus compliance, and profile page includes version matrix, inputs, checks, artifact, taxonomy, troubleshooting, thin caller, no-deployment boundary, and planned example status.

- [ ] **Step 2: Verify red**

Run: `node --test tests/documentation-readability.test.mjs tests/technology-catalogue-navigation.test.mjs`

Expected: FAIL because Go profile docs are absent.

- [ ] **Step 3: Write human-readable documentation**

Keep root README to four essential badges. Add catalogue navigation and Go profile detail without duplicating global policies. Clearly state that example becomes linked only after its pilot exists.

- [ ] **Step 4: Run documentation and full tests**

Run: `node --test tests/documentation-readability.test.mjs tests/technology-catalogue-navigation.test.mjs && npm test && npm run validate:repository && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add README.md catalogue docs tests
git commit -m "docs: add Go service workflow catalogue"
```

### Task 7: Platform Workflow v0.4.0 PR and Immutable Release

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `repository-policy.json`
- Modify: release-version assertions in `tests/`

**Interfaces:**
- Produces merged workflow SHA and release tag consumed by `example-app-go` and governance mapping.

- [ ] **Step 1: Set release version v0.4.0**

Confirm `v0.4.0` is unused with `gh release view v0.4.0`. Record `0.4.0` consistently in package, policy, README badge, changelog, and tests because Go Service is a new capability.

- [ ] **Step 2: Add release notes and verify**

Document Go versions, canonical binary, compatibility lane, security boundary, adoption path, and absence of deployment. Run `npm test && npm run lint && npm run typecheck && npm run validate:repository && git diff --check`.

- [ ] **Step 3: Commit, push, and create PR**

Create `/private/tmp/go-service-workflow-pr.md` with this exact body:

```markdown
## Ringkasan
- menambahkan typed Go Service contract dan immutable digest
- menjalankan format, vet, unit, race, coverage, vulnerability, dan build checks
- menghasilkan satu canonical Linux amd64 binary dari Go 1.26.7
- menjalankan Go 1.27.0 sebagai blocking artifactless compatibility lane
- menambahkan profile documentation dan thin caller guide

## Batas
- tidak ada secret, OIDC, deployment, OCI image, arm64 artifact, atau Go CLI
- status Available bukan klaim operational compliance

## Validasi
- npm test, lint, typecheck, repository validator, ShellCheck, dan diff check lulus
```

```bash
git add CHANGELOG.md README.md package.json package-lock.json repository-policy.json tests
git commit -m "release: prepare Go service workflow release"
git push -u origin feat/go-service-foundation
gh pr create --base main --title "Add governed Go service workflow" --body-file /private/tmp/go-service-workflow-pr.md
```

The PR body must summarize contract, checks, artifact, compatibility, documentation, and full verification counts.

- [ ] **Step 4: Wait for checks and merge**

Run `gh pr checks --watch`. Squash merge only after all checks pass. Pull `main`, rerun the full validation command, and capture `git rev-parse HEAD` as `GO_WORKFLOW_RELEASE_SHA`.

- [ ] **Step 5: Create release on verified SHA**

Confirm the tag is unused with `gh release view`. Create the release with `--target "$GO_WORKFLOW_RELEASE_SHA"`, then verify `tagName`, `targetCommitish`, URL, and body.

### Task 8: Create and Implement `example-app-go`

**Files:**
- Create repository: `OXY7O/example-app-go` (private)
- Create all files listed in the example repository file map.

**Interfaces:**
- Thin caller consumes `.github/workflows/ci-profile-go-service.yml@GO_WORKFLOW_RELEASE_SHA`.
- API returns JSON `{"status":"ok"}` and deterministic example JSON for numeric IDs.

- [ ] **Step 1: Create private repository and local checkout**

Run `gh repo create OXY7O/example-app-go --private --description "Governed Go Service example implementation"`. Clone it inside the project workspace and create branch `feat/go-service-example`.

- [ ] **Step 2: Write failing application and repository tests**

Add handler tests for health, example ID, invalid ID, method rejection, and deterministic JSON. Add Node tests for policy, thin caller SHA, no secrets/deployment, version catalogue, README sections, and evidence schema.

- [ ] **Step 3: Verify red**

Run `go test -race ./...` and `node --test tests/**/*.test.mjs`.

Expected: FAIL because application, policy, and caller do not exist.

- [ ] **Step 4: Implement minimal standard-library API**

Use `http.ServeMux`, explicit timeouts, JSON content type, structured deterministic responses, and no external runtime dependency. Add `golang.org/x/vuln/cmd/govulncheck@v1.7.0` using the Go `tool` directive so `go.sum` is non-empty while the runtime application remains standard-library-only.

- [ ] **Step 5: Add thin caller and repository controls**

Pin reusable workflow to `GO_WORKFLOW_RELEASE_SHA`; use exact Go 1.26.7 canonical input and local compatibility catalogue containing Go 1.27.0. Add policy `go-service`, governance `v1.2.0`, deployment false, secrets false.

- [ ] **Step 6: Write onboarding and evidence docs**

README must include five essential badges at most, repository relationships, quick start, expected output, endpoint table, version matrix, artifact contents, adoption steps, onboarding checklist, troubleshooting, and no-deployment boundary.

- [ ] **Step 7: Run full local verification**

Run `gofmt -w .`, `go vet ./...`, `go test -race -cover ./...`, `node --test tests/**/*.test.mjs`, repository validator, and `git diff --check`.

- [ ] **Step 8: Commit, push, and open PR**

Create `/private/tmp/go-service-example-pr.md` with this exact body:

```markdown
## Ringkasan
- menambahkan standard-library Go Service example dengan endpoint health dan deterministic resource
- mengadopsi immutable reusable workflow Go Service
- membuktikan canonical binary dan artifactless compatibility lane
- menambahkan repository policy, onboarding, traceability, dan safe evidence template

## Batas
- tidak ada application secret atau deployment
- repository berstatus pilot, bukan production starter atau klaim compliance

## Validasi
- gofmt, go vet, race test, coverage, Node contract tests, repository validator, dan diff check lulus
```

```bash
git add .
git commit -m "feat: add governed Go service example"
git push -u origin feat/go-service-example
gh pr create --base main --title "Add governed Go service example" --body-file /private/tmp/go-service-example-pr.md
```

### Task 9: Pilot Evidence, Example Merge, and v0.1.0 Release

**Files:**
- Create: `docs/results/2026-08-29-go-service-pilot.json`
- Modify: `CHANGELOG.md`, `README.md`, package/repository version metadata if present.

**Interfaces:**
- Evidence consumes actual GitHub run IDs, source/workflow SHAs, contract digest, artifact ID/name/digests, Go versions, runner image, and check conclusions.

- [ ] **Step 1: Wait for all example PR checks**

Require family, profile, Go 1.26.7 canonical package, Go 1.27.0 compatibility, and repository validation to pass. Download artifact metadata only; do not store raw logs or secrets.

- [ ] **Step 2: Validate artifact and record evidence**

Verify archive SHA-256, manifest SHA-256, binary checksum, exact file list, source SHA, workflow SHA, `linux/amd64`, and absence of prohibited files. Write the sanitized actual record with external run URL.

- [ ] **Step 3: Push evidence and rerun checks**

Commit the evidence record, push, wait for checks again, and require the compatibility lane to remain artifactless.

- [ ] **Step 4: Merge and verify main**

Squash merge, pull main, rerun Go, Node, repository, and diff checks. Capture merged SHA.

- [ ] **Step 5: Create example v0.1.0 release**

Set version/changelog to `v0.1.0`, verify tag unused, create release on merged verified SHA, and verify release body explicitly says pilot, binary-only, and no deployment.

### Task 10: Governance Implementation Mapping and v1.3.0 Release

**Files:**
- Modify: `platform-governance/catalogues/technology-stack/families.json`
- Modify: `platform-governance/catalogues/technology-stack/profiles.json`
- Modify: `platform-governance/catalogues/technology-stack/README.md`
- Modify: `platform-governance/README.md`
- Modify: `platform-governance/CHANGELOG.md`
- Create: `platform-governance/tests/go-service-implementation-map.test.mjs`

**Interfaces:**
- Go family/profile lifecycle becomes `pilot`.
- Compatibility remains `not-validated`.
- `workflow_reference` uses `GO_WORKFLOW_RELEASE_SHA`.
- `example_repository` equals `OXY7O/example-app-go`.

- [ ] **Step 1: Add failing governance mapping test**

Assert Go family/profile are pilot, compatibility is not-validated, workflow reference ends in an immutable 40-character SHA, example repository is canonical, Go CLI remains planned with null references, and no support/compliance claim is introduced.

- [ ] **Step 2: Verify red**

Run `node --test tests/go-service-implementation-map.test.mjs`.

Expected: FAIL because Go Service is still planned.

- [ ] **Step 3: Update catalogue and documentation**

Use actual workflow SHA and example repository. Bump desired catalogue minor version, document migration and limits, but keep validation/evidence state separate.

- [ ] **Step 4: Run complete governance validation**

Run `node --test tests/*.test.mjs tests/**/*.test.mjs`, Ruby catalogue validator, positive/negative shell tests, and `git diff --check`.

- [ ] **Step 5: PR, merge, verify, and release**

Create a governance PR with release `v1.3.0`, wait for available checks, squash merge, rerun validation on main, and create the release on the exact verified SHA. Verify the GitHub Release target and body.

### Task 11: Cross-Repository Closure Audit

**Files:**
- No planned source changes; findings require a new focused commit in the owning repository.

- [ ] **Step 1: Verify canonical navigation**

Confirm `platform-workflow README → Go profile → example-app-go` and governance catalogue → workflow/example links all resolve to canonical private repositories.

- [ ] **Step 2: Verify release and SHA relationships**

Confirm example thin caller SHA equals the released workflow implementation SHA; governance mapping uses the same SHA; all three release tags target tested merged commits.

- [ ] **Step 3: Verify security and scope**

Search active files for secrets inheritance, write permissions, OIDC, environment, deployment, arbitrary command inputs, mutable action refs, duplicate canonical artifact uploads, and accidental support/compliance claims. Expected result: none.

- [ ] **Step 4: Record completion summary**

Report PR URLs, release URLs, merged SHAs, test counts, actual compatibility results, artifact identity/digests, remaining planned targets (`go-cli`, arm64, OCI, deployment), and the next recommended stack.
