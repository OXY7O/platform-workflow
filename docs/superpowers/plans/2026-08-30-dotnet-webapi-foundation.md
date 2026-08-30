# .NET Web API Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyediakan reusable CI dan deterministic framework-dependent application package untuk .NET Web API, membuktikannya melalui `OXY7O/example-app-dotnet`, lalu memetakan referensi immutable di governance.

**Architecture:** `platform-workflow` menambahkan family .NET, profile .NET Web API, application packager, preview compatibility lane, dan reusable workflow tanpa mengubah kontrak PHP/Laravel atau Go. Consumer private repository memakai thin caller yang dipin ke commit SHA; SDK 10.0.110 menghasilkan satu `net10.0/linux-x64` artifact, sedangkan SDK 11 preview menjadi opt-in, non-blocking, artifactless compatibility lane.

**Tech Stack:** TypeScript 6, Node.js 24, GitHub Actions, .NET SDK 10.0.110, .NET SDK 11.0.100-preview.6.26359.118, ASP.NET Core controllers, xUnit, Bash, AJV JSON Schema, tar/gzip, SHA-256.

**Spec:** `docs/superpowers/specs/2026-08-30-dotnet-webapi-foundation-design.md`

## Global Constraints

- Canonical SDK adalah exact `10.0.110`; target framework `net10.0`.
- Compatibility SDK adalah exact `11.0.100-preview.6.26359.118`, opt-in, non-blocking, dan artifactless.
- Canonical target hanya framework-dependent `linux-x64`; self-contained, Windows, arm64, OCI, deployment, dan .NET Worker tetap planned.
- Caller/reusable workflow hanya `contents: read`, tanpa secrets, OIDC, environment, atau deployment.
- Caller tidak boleh mengirim command, MSBuild property bebas, NuGet source, absolute path, traversal, arbitrary filter, atau cache key.
- Tepat satu canonical archive bernama `<artifact-name>_<application-version>_net10.0_linux-x64.tar.gz`.
- Artifact berstatus `ci-qualified`, bukan release-ready atau deployment authorization.
- External action dan consumer workflow dipin ke full 40-character commit SHA.
- Profile menjadi `Available/pilot` hanya setelah workflow dan example release serta actual pilot evidence tersedia.
- Existing PHP/Laravel dan Go contracts/workflows tidak boleh berubah perilakunya.

---

## File Map

### `platform-workflow`

- `contracts/dotnet-webapi-input.schema.json`: canonical caller contract.
- `contracts/dotnet-compatibility-*.schema.json`: catalogue dan preview lane contract.
- `contracts/dotnet-application-*.schema.json`: package input dan manifest.
- `src/contracts/dotnet-types.ts`: shared .NET interfaces.
- `src/validate-dotnet-webapi-contract.ts`: validation dan canonical digest.
- `src/generate-dotnet-compatibility-matrix.ts`: preview invariant enforcement.
- `src/build-dotnet-application-artifact.ts`: deterministic publish package.
- `src/action-*.ts`, `actions/*/action.yml`, `dist/*`: Node 24 action adapters.
- `scripts/dotnet-family-ci.sh`: SDK, lock, format, build, test, coverage, dependency checks.
- `scripts/dotnet-webapi-ci.sh`: Web SDK, target framework, publish validation.
- `.github/workflows/ci-family-dotnet.yml`: reusable family checks.
- `.github/workflows/ci-compatibility-dotnet-webapi.yml`: preview artifactless checks.
- `.github/workflows/ci-profile-dotnet-webapi.yml`: canonical orchestration.
- `catalogue/dotnet-webapi.json`: canonical dan preview lane catalogue.
- `docs/profiles/dotnet-webapi/`: landing page dan thin caller.
- `tests/dotnet-*.test.mjs`: contracts, executors, artifact, workflow, dan navigation.

### `example-app-dotnet`

- `src/Example.Api/`: controller-based ASP.NET Core API.
- `tests/Example.Api.Tests/`: endpoint and integration tests.
- `Example.App.Dotnet.slnx`, `global.json`, `Directory.Build.props`: controlled build root.
- `packages.lock.json` files: locked dependency graphs.
- `.github/workflows/ci.yml`: immutable thin caller.
- `compatibility/dotnet-webapi.json`: preview lane.
- `repository-policy.json`, `docs/`, `tests/`: boundary, onboarding, traceability, evidence.

### `platform-governance`

- `catalogues/technology-stack/families.json`: .NET pilot implementation map.
- `catalogues/technology-stack/profiles.json`: Web API workflow/example references.
- `catalogues/technology-stack/README.md`, `README.md`, `CHANGELOG.md`: navigation/release.
- `tests/dotnet-webapi-implementation-map.test.mjs`: no-support-claim mapping.

---

### Task 1: Typed .NET Web API Contract

**Files:**
- Create: `contracts/dotnet-webapi-input.schema.json`
- Create: `src/contracts/dotnet-types.ts`
- Create: `src/validate-dotnet-webapi-contract.ts`
- Create: `src/action-validate-dotnet-webapi-contract.ts`
- Create: `actions/validate-dotnet-webapi-contract/action.yml`
- Create: `tests/validate-dotnet-webapi-contract.test.mjs`
- Create: `tests/fixtures/contracts/valid-dotnet-webapi.json`
- Modify: `package.json`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `validateDotnetWebApiContract(input: unknown): DotnetWebApiInput`
- Produces: `calculateDotnetWebApiContractDigest(input: unknown): string`
- Action outputs: `contract-digest`, `profile-key`, `sdk-version`, `artifact-name`

- [ ] **Step 1: Write failing contract tests**

Use this canonical fixture:

```json
{"schemaVersion":"1.0","governanceVersion":"v1.3.0","catalogueVersion":"1.3.0","profileKey":"dotnet-webapi","sdkVersion":"10.0.110","targetFramework":"net10.0","solutionPath":"Example.App.Dotnet.slnx","projectPath":"src/Example.Api/Example.Api.csproj","testProjectPath":"tests/Example.Api.Tests/Example.Api.Tests.csproj","artifactName":"example-api","applicationVersion":"0.1.0","runtimeIdentifier":"linux-x64","publishMode":"framework-dependent","coverageThreshold":80,"retentionDays":14,"evidenceMode":"safe-metadata","extensions":[]}
```

Assert acceptance and stable digest across key order. Assert rejection for extra `command`, `msbuildProperties`, `nugetSource`, `testFilter`, `cacheKey`, `../outside`, absolute paths, SDK other than 10.0.110, framework other than net10.0, invalid artifact/version, RID other than linux-x64, coverage outside 0–100, retention outside 1–30, and extension outside allowlist.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/validate-dotnet-webapi-contract.test.mjs`

Expected: FAIL because `lib/validate-dotnet-webapi-contract.js` is absent.

- [ ] **Step 3: Implement strict schema and validator**

Use AJV draft 2020-12, `additionalProperties: false`, relative no-traversal path patterns, recursively sorted JSON, and `sha256:` digest. Keep `sdkVersion`, target, RID, and publish mode as constants.

- [ ] **Step 4: Add Node action and immutable bundle**

Configure `using: node24`, parse only `contract-json`, expose the four safe outputs, add the ncc command to `bundle:all`, and require source/schema/action/dist in repository validation.

- [ ] **Step 5: Run focused validation**

Run: `npm run bundle:all && node --test tests/validate-dotnet-webapi-contract.test.mjs && npm run lint && npm run typecheck && npm run validate:repository`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add contracts src actions dist tests package.json scripts
git commit -m "feat: add typed .NET Web API caller contract"
```

### Task 2: .NET Family and Web API Executors

**Files:**
- Create: `scripts/dotnet-family-ci.sh`
- Create: `scripts/dotnet-webapi-ci.sh`
- Create: `actions/dotnet-family-check/action.yml`
- Create: `actions/dotnet-webapi-check/action.yml`
- Create: `tests/dotnet-executor-scripts.test.mjs`
- Create: `tests/fixtures/bin/dotnet`
- Create fixture trees: `tests/fixtures/dotnet-webapi-valid/`, `dotnet-missing-lock/`, `dotnet-format-failure/`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- `dotnet-family-ci.sh <solution-path> <project-path> <test-project-path> <sdk-version> <coverage-threshold>`
- `dotnet-webapi-ci.sh <project-path> <target-framework> <runtime-identifier> <publish-directory>`
- Both emit typed records through `scripts/lib/result.sh` and never evaluate caller text.

- [ ] **Step 1: Write failing executor tests**

With a fake `dotnet` binary, assert the exact ordered argument arrays for version, locked restore, format verify, Release build, test/coverage, vulnerable/deprecated package checks, and framework-dependent publish. Assert missing lock is `dependency`, format failure is `quality`, wrong target is `configuration`, absolute output outside `RUNNER_TEMP` is rejected, and scripts contain no `eval`.

- [ ] **Step 2: Verify red**

Run: `node --test tests/dotnet-executor-scripts.test.mjs`

Expected: FAIL because executor scripts do not exist.

- [ ] **Step 3: Implement family checks**

Validate realpath containment and marker files. Require exact `dotnet --version`. Run non-interactively:

```text
dotnet restore <solution> --locked-mode
dotnet format <solution> --verify-no-changes --no-restore
dotnet build <solution> --configuration Release --no-restore
dotnet test <test-project> --configuration Release --no-build --no-restore --collect "XPlat Code Coverage" --results-directory <RUNNER_TEMP>
dotnet package list <project> --vulnerable --include-transitive --format json
dotnet package list <project> --deprecated --include-transitive --format json
```

Parse machine-readable coverage and package results; do not grep human output for readiness. Remove temporary result files after normalized values are produced.

- [ ] **Step 4: Implement profile validation and publish**

Verify `Microsoft.NET.Sdk.Web`, `TargetFramework=net10.0`, and controlled project path. Run:

```text
dotnet publish <project> --configuration Release --no-build --no-restore --framework net10.0 --runtime linux-x64 --self-contained false --output <controlled-directory>
```

Reject symlink output, empty publish, runtime packs, source/test files, and any output outside `RUNNER_TEMP`.

- [ ] **Step 5: Add composite actions and static validation**

Expose only typed paths/version/threshold/output inputs. Invoke scripts through `${{ github.action_path }}`. Extend repository validator and the ShellCheck scope test to cover both scripts.

- [ ] **Step 6: Run executor tests**

Run: `node --test tests/dotnet-executor-scripts.test.mjs && bash -n scripts/dotnet-family-ci.sh scripts/dotnet-webapi-ci.sh && npm run validate:repository`

When ShellCheck is available, also run: `shellcheck scripts/dotnet-family-ci.sh scripts/dotnet-webapi-ci.sh scripts/lib/result.sh`.

- [ ] **Step 7: Commit**

```bash
git add scripts actions tests
git commit -m "feat: add governed .NET family and Web API checks"
```

### Task 3: Deterministic .NET Application Artifact

**Files:**
- Create: `contracts/dotnet-application-artifact-input.schema.json`
- Create: `contracts/dotnet-application-manifest.schema.json`
- Create: `src/build-dotnet-application-artifact.ts`
- Create: `src/action-build-dotnet-application-artifact.ts`
- Create: `actions/build-dotnet-application-artifact/action.yml`
- Create: `tests/build-dotnet-application-artifact.test.mjs`
- Create: `tests/fixtures/dotnet-publish-safe/`
- Modify: `package.json`, `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `buildDotnetApplicationArtifact(input: DotnetApplicationArtifactInput): Promise<DotnetApplicationArtifactOutput>`
- Outputs: `artifact-id`, `artifact-name`, `artifact-path`, `digest`, `manifest-path`, `manifest-digest`, `readiness`

- [ ] **Step 1: Write failing deterministic package tests**

Assert two builds from identical publish bytes/metadata have identical archive and manifest digests. Require name `example-api_0.1.0_net10.0_linux-x64.tar.gz`, normalized uid/gid/mode/mtime, sorted paths, published files plus one manifest, and rejection of symlink, `.env`, private-key material, source/test/coverage files, runtime self-contained payload markers, invalid SHA/version/RID/framework, and unsafe output path.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/build-dotnet-application-artifact.test.mjs`

Expected: FAIL because the builder module is absent.

- [ ] **Step 3: Implement package builder**

Validate input, recursively enumerate the verified publish directory without following symlinks, reject prohibited paths/content, create sorted per-file digest records, write deterministic TAR headers and gzip mtime zero, then return detached safe output values.

- [ ] **Step 4: Add Node action, bundle, and validator**

Use Node 24 and add the new ncc output to `bundle:all`. Require both schemas, source, action, and dist files.

- [ ] **Step 5: Run artifact and regression tests**

Run: `npm run bundle:all && node --test tests/build-dotnet-application-artifact.test.mjs tests/build-go-binary-artifact.test.mjs tests/build-artifact.test.mjs && npm run lint && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add contracts src actions dist tests package.json scripts
git commit -m "feat: build deterministic .NET application packages"
```

### Task 4: Preview Compatibility Contract and Matrix

**Files:**
- Create: `contracts/dotnet-compatibility-catalogue.schema.json`
- Create: `contracts/dotnet-compatibility-input.schema.json`
- Create: `catalogue/dotnet-webapi.json`
- Create: `src/validate-dotnet-compatibility-contract.ts`
- Create: `src/action-validate-dotnet-compatibility-contract.ts`
- Create: `src/generate-dotnet-compatibility-matrix.ts`
- Create: `src/action-generate-dotnet-compatibility-matrix.ts`
- Create action manifests and bundled dist for both adapters.
- Create: `tests/generate-dotnet-compatibility-matrix.test.mjs`
- Modify: `package.json`, `scripts/validate-repository.mjs`

**Interfaces:**
- Produces: `validateDotnetCompatibilityContract(input: unknown): DotnetCompatibilityInput`
- Produces: `generateDotnetCompatibilityMatrix(catalogue, {includePreview}): {include: DotnetCompatibilityInput[]}`
- Preview identity: `dotnet-sdk-11.0.100-preview.6.26359.118-net10.0-linux-x64`

- [ ] **Step 1: Write failing matrix tests**

Assert preview is excluded by default; opt-in includes exactly one non-blocking artifactless lane. Reject duplicate ID, contradictory identity/version/framework/RID, blocking preview, artifact-enabled preview, canonical lane in compatibility output, absolute catalogue path, traversal, and realpath escape.

- [ ] **Step 2: Verify red**

Run: `npm run build && node --test tests/generate-dotnet-compatibility-matrix.test.mjs`

- [ ] **Step 3: Implement schemas, validator, and generator**

Enforce exact preview identity, SDK, net10.0, linux-x64, `compatibility-only`, `preview`, `blocking:false`, `artifact:false`, and opt-in eligibility. Resolve catalogue paths by repository and target realpaths.

- [ ] **Step 4: Add action adapters and bundles**

Expose only safe matrix/contract outputs, use Node 24, extend `bundle:all`, and update repository validation.

- [ ] **Step 5: Run tests and commit**

Run: `npm run bundle:all && node --test tests/generate-dotnet-compatibility-matrix.test.mjs && npm run lint && npm run typecheck && npm run validate:repository`

```bash
git add catalogue contracts src actions dist tests package.json scripts
git commit -m "feat: add governed .NET preview compatibility contracts"
```

### Task 5: Reusable .NET Workflows

**Files:**
- Create: `.github/workflows/ci-family-dotnet.yml`
- Create: `.github/workflows/ci-compatibility-dotnet-webapi.yml`
- Create: `.github/workflows/ci-profile-dotnet-webapi.yml`
- Create: `tests/dotnet-workflow-contract.test.mjs`
- Modify: `scripts/validate-repository.mjs`

**Interfaces:**
- Canonical workflow input: `contract-json`
- Optional inputs: `compatibility-catalogue-path`, `include-preview`
- Outputs: readiness, failure category, artifact ID/name/digests, evidence metadata, preview result

- [ ] **Step 1: Write failing workflow contract tests**

Parse YAML and assert `workflow_call`, `contents: read`, immutable external refs, exact SDKs, one upload only in canonical package job, preview conditional and non-blocking, preview workflow artifactless, no secrets/OIDC/environment/deploy text, and safe outputs.

- [ ] **Step 2: Verify red**

Run: `node --test tests/dotnet-workflow-contract.test.mjs`

- [ ] **Step 3: Implement family and compatibility workflows**

Family validates contract, configures exact SDK, runs family action, calculates dependency digest, normalizes result. Compatibility configures exact preview SDK, validates preview contract, runs family/profile validation, returns evidence, and never uploads.

- [ ] **Step 4: Implement canonical profile orchestrator**

Call family workflow, repeat controlled checks in package job, publish to `RUNNER_TEMP`, build package, upload exactly one artifact on `ci-qualified`, normalize evidence, generate optional preview matrix, and call compatibility workflow with `continue-on-error` semantics at orchestration level.

- [ ] **Step 5: Pin internal actions to a real commit**

Commit the implementation without workflow self-pins, capture `git rev-parse HEAD`, replace internal action refs with that full SHA, run validator, and commit the pin correction separately.

- [ ] **Step 6: Run all workflow tests**

Run: `node --test tests/dotnet-workflow-contract.test.mjs tests/go-workflow-contract.test.mjs tests/workflow-contract.test.mjs && npm test && npm run validate:repository && git diff --check`

- [ ] **Step 7: Commit**

```bash
git add .github tests scripts
git commit -m "feat: orchestrate reusable .NET Web API CI"
```

### Task 6: .NET Documentation and Catalogue

**Files:**
- Create: `docs/profiles/dotnet-webapi/README.md`
- Create: `docs/profiles/dotnet-webapi/THIN-CALLER.md`
- Modify: `docs/profiles/README.md`, `README.md`, `catalogue/technology-stack.json`
- Modify: `tests/documentation-readability.test.mjs`, `tests/technology-catalogue-navigation.test.mjs`

- [ ] **Step 1: Write failing navigation/readability tests**

Assert .NET family/profile are `In progress/pilot/not-validated`, workflow reference is immutable, example remains null, root links the profile but not a nonexistent example, and detail includes SDK/framework matrix, contract, checks, package, taxonomy, troubleshooting, thin caller, example status, `ci-qualified`, and no deployment.

- [ ] **Step 2: Verify red**

Run: `node --test tests/documentation-readability.test.mjs tests/technology-catalogue-navigation.test.mjs`

- [ ] **Step 3: Write documentation**

Explain developer journey, exact versions, locked restore, package contents, preview opt-in, failure handling, Safe evidence, onboarding checklist, and scope boundary. Use four essential root badges only.

- [ ] **Step 4: Run documentation and full tests**

Run: `npm test && npm run lint && npm run typecheck && npm run validate:repository && git diff --check`

- [ ] **Step 5: Commit**

```bash
git add README.md catalogue docs tests
git commit -m "docs: add .NET Web API workflow catalogue"
```

### Task 7: Platform Workflow Minor Release

**Files:**
- Modify: `CHANGELOG.md`, `README.md`, `package.json`, `package-lock.json`, `repository-policy.json`, release assertions.

- [ ] **Step 1: Select the next unused minor release**

Check existing tags with `gh release list`. Expected target is `v0.5.0`; if it already exists, stop and use the next unused minor without replacing a published release.

- [ ] **Step 2: Prepare release metadata**

Document .NET 10 canonical SDK, package, preview lane, permission boundary, onboarding path, unchanged PHP/Go behavior, and no deployment.

- [ ] **Step 3: Run final local verification**

Run: `npm test && npm run lint && npm run typecheck && npm run validate:repository && bash -n scripts/dotnet-family-ci.sh scripts/dotnet-webapi-ci.sh && git diff --check`.

- [ ] **Step 4: Commit, push, and create PR**

```bash
git add CHANGELOG.md README.md package.json package-lock.json repository-policy.json tests
git commit -m "release: prepare .NET Web API workflow release"
git push -u origin feat/dotnet-webapi-foundation
gh pr create --base main --title "Add governed .NET Web API workflow" --body-file /private/tmp/dotnet-webapi-workflow-pr.md
```

PR body must list contract, checks, artifact, preview boundary, documentation, exact test counts, and local ShellCheck availability.

- [ ] **Step 5: Wait, merge, verify, release**

Require GitHub checks to pass, squash merge, pull main, rerun full verification, capture `DOTNET_WORKFLOW_SHA`, then create the minor release on that exact SHA and verify tag/target/body.

### Task 8: Create `OXY7O/example-app-dotnet`

**Files:**
- Create private repository and every file in the example file map.

- [ ] **Step 1: Create private repository with an empty main base**

Create `OXY7O/example-app-dotnet`, ensure `main` is the default branch before pushing feature work, then create `feat/dotnet-webapi-example`. This avoids the default-branch cleanup required by the Go pilot.

- [ ] **Step 2: Install canonical SDK in an isolated directory**

Use the official `dotnet-install.sh` with version `10.0.110` and a task-specific directory under `/private/tmp`; do not alter the global SDK installation. Verify `dotnet --version` returns exactly `10.0.110`.

- [ ] **Step 3: Write failing API and repository tests**

Add xUnit integration tests for health, numeric ID, invalid ID, missing resource, method rejection, content type, and deterministic JSON. Add Node tests for policy, immutable caller SHA, no secrets/deployment, preview non-blocking/artifactless, README journey, and evidence schema.

- [ ] **Step 4: Verify red**

Run isolated SDK `dotnet test` and `node --test tests/**/*.test.mjs`.

Expected: FAIL because application/policy/caller files are absent.

- [ ] **Step 5: Implement controller-based API**

Create `ExampleController`, health controller, explicit error responses, deterministic DTOs, ASP.NET Core test host, bounded request behavior, and no database/auth/cloud dependency. Set `TargetFramework=net10.0`, nullable/implicit usings enabled, warnings controlled, deterministic build, and lock files required.

- [ ] **Step 6: Add thin caller and repository controls**

Pin `ci-profile-dotnet-webapi.yml@DOTNET_WORKFLOW_SHA`, use canonical contract, point to the local compatibility catalogue, set preview opt-in true for pilot, and declare read-only permissions. Add policy with deployment/secrets false.

- [ ] **Step 7: Write human-readable onboarding docs**

README must have at most five essential badges, repository relationship, quick start, endpoints, matrix, checks, artifact, adoption, onboarding, troubleshooting, and no-deployment boundary. Add traceability and sanitized evidence schema/example.

- [ ] **Step 8: Run full local verification**

Run exact SDK locked restore, format verify, Release build, test/coverage, vulnerable/deprecated checks, Node tests, repository validator, and diff check. Require coverage at least 80%.

- [ ] **Step 9: Commit, push, and open PR**

Commit `feat: add governed .NET Web API example`, push the feature branch, and open a PR whose body records exact SDK, checks, coverage, workflow SHA, and boundaries.

### Task 9: Pilot Evidence and Example v0.1.0

- [ ] **Step 1: Wait for canonical and preview jobs**

Require canonical family/package success. Preview may fail without blocking canonical readiness, but investigate and record its actual result; do not claim preview compatibility when it fails.

- [ ] **Step 2: Download and verify canonical artifact**

Verify GitHub artifact envelope digest, package SHA-256, manifest digest, exact file list/modes, source/workflow SHA, SDK 10.0.110, net10.0, linux-x64, framework-dependent mode, and prohibited-file absence. Confirm preview uploaded zero artifacts.

- [ ] **Step 3: Record actual Safe evidence**

Create `docs/results/2026-08-30-dotnet-webapi-pilot.json` with run/job IDs, URLs, branch/head/source SHAs, checks, contract/dependency digests, runner metadata, package/manifest/file digests, retention, preview conclusion/artifact count, and `deploymentAuthorized:false`.

- [ ] **Step 4: Push evidence and rerun checks**

Commit `docs: record .NET Web API pilot evidence`, push, and require the second run to preserve canonical success and artifact constraints.

- [ ] **Step 5: Merge, verify main, and release**

Squash merge, pull main, rerun exact SDK and Node validation, create `v0.1.0` on the verified merge SHA, and verify the release body says pilot, framework-dependent package, preview result, and no deployment.

### Task 10: Close Platform Workflow Navigation

- [ ] **Step 1: Write failing closure tests**

Assert .NET Web API is `available/pilot/not-validated`, workflow points to `DOTNET_WORKFLOW_SHA`, example points to `https://github.com/OXY7O/example-app-dotnet`, root/profile/thin caller navigation resolves, and planned .NET Worker retains null refs.

- [ ] **Step 2: Update portal and catalogue**

Replace `In progress` with `Available`, add example/release/evidence links, and retain the executable workflow SHA rather than a documentation-only merge SHA.

- [ ] **Step 3: Prepare patch release**

Use the next unused patch after the Task 7 release, document that executable behavior is unchanged, run  all validations, PR, merge, verify, and release on exact main SHA.

### Task 11: Governance Mapping and Minor Release

- [ ] **Step 1: Write failing governance tests**

Assert .NET family/Web API are `pilot`, compatibility `not-validated`, workflow ends in `DOTNET_WORKFLOW_SHA`, example is `OXY7O/example-app-dotnet`, default artifact is `application-package`, and .NET Worker remains planned with null refs.

- [ ] **Step 2: Update desired catalogue and docs**

Bump all technology catalogue files to the next minor catalogue version, add immutable family/profile/example mapping and exact pilot boundaries, update root status/changelog, and preserve no support/compliance claim.

- [ ] **Step 3: Validate governance completely**

Run Ruby catalogue validator, all negative catalogue tests, all Node governance tests, and diff check.

- [ ] **Step 4: PR, merge, verify, release**

Create the next unused governance minor release, wait for configured checks, squash merge, rerun validation on main, and create the release on exact verified SHA.

### Task 12: Cross-Repository Closure Audit

- [ ] **Step 1: Verify canonical navigation**

Confirm governance catalogue → workflow/profile → example and workflow root → profile → example links resolve to canonical private repositories.

- [ ] **Step 2: Verify SHA and releases**

Confirm example thin caller and governance mapping use the executable workflow release SHA; all release tags target tested merge commits; default branch for each repository is `main`.

- [ ] **Step 3: Verify security and artifact scope**

Search active workflows for mutable refs, inherited secrets, write permissions, OIDC, environment, deployment, arbitrary command inputs, duplicate uploads, and preview artifact. Expected result: none; canonical upload count is exactly one.

- [ ] **Step 4: Report closure**

Report PR/release URLs, merge SHAs, test counts, actual preview result, artifact IDs/digests, coverage, remaining planned targets (.NET Worker, .NET 8 legacy, self-contained, Windows/arm64, OCI, deployment), and recommend Python as the next stack.
