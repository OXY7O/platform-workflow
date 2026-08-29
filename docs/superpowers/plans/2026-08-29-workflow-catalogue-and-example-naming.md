# Workflow Catalogue and Example Naming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjadikan `platform-workflow` portal lintas tech stack, menyediakan landing page PHP/Laravel dan onboarding yang lengkap, serta mengganti seluruh penamaan aktif `demo` menjadi `example`.

**Architecture:** `platform-governance` tetap menjadi source of truth untuk status dan implementation reference. `platform-workflow/README.md` menjadi katalog umum, sementara detail PHP/Laravel hidup pada halaman profile tersendiri dan mengarah ke repository `example-app-laravel`. Example repository menjadi consumer teknis, bukan pemilik kontrak reusable workflow.

**Tech Stack:** Markdown, JSON, JSON Schema 2020-12, Node.js 24 test runner, GitHub Actions, GitHub CLI.

**Spec:** `docs/superpowers/specs/2026-08-29-workflow-catalogue-and-example-naming-design.md`

## Global Constraints

- Badge README utama `platform-workflow` hanya release, status CI, governance baseline, dan deployment scope.
- Katalog menampilkan `php-laravel` sebagai `Available`; profile lain tetap `Planned` tanpa link implementasi aktif.
- Repository implementasi referensi memakai pola `example-app-<profile>`.
- Istilah `pilot` tetap dipakai untuk tahap validasi; istilah `demo` tidak dipakai pada dokumentasi dan metadata aktif.
- Reusable workflow, compatibility matrix, artifact behavior, permissions, dan deployment boundary tidak berubah.
- Semua reusable workflow tetap dipin ke full commit SHA.
- Tidak ada secret, username aktual, atau evidence sensitif yang ditambahkan.
- Riwayat Git dan release lama tidak ditulis ulang.

---

### Task 1: Selaraskan Governance Catalogue dan Terminologi Example

**Files:**
- Modify: `platform-governance/schemas/ci/technology-profile.schema.json`
- Modify: `platform-governance/catalogues/technology-stack/profiles.json`
- Modify: `platform-governance/catalogues/technology-stack/families.json`
- Modify: `platform-governance/docs/GOVERNANCE-TO-TECHNICAL-IMPLEMENTATION-CONTRACT.md`
- Modify: `platform-governance/docs/ci/technology-stack/PLATFORM-WORKFLOW-IMPLEMENTATION-MAP.md`
- Modify: active governance Markdown files returned by `rg -l 'demo-apps|demo-app-|demo application|demo teknis' README.md docs catalogues schemas`
- Create: `platform-governance/tests/example-naming-and-implementation-map.test.mjs`

**Interfaces:**
- Consumes: governance profile schema and catalogue version `1.1.0`.
- Produces: field `implementation.example_repository`, PHP/Laravel status `pilot/not-validated`, workflow reference, and canonical example repository URL.

- [ ] **Step 1: Write the failing governance terminology test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";

test("active governance sources use example naming", () => {
  const result = spawnSync("rg", [
    "-n", "demo-apps|demo-app-|demo application|demo teknis",
    "README.md", "docs", "catalogues", "schemas",
    "--glob", "!CHANGELOG.md", "--glob", "!docs/superpowers/**"
  ], {encoding: "utf8"});
  assert.equal(result.status, 1, result.stdout);
});

test("PHP Laravel catalogue records the verified implementation", () => {
  const catalogue = JSON.parse(fs.readFileSync("catalogues/technology-stack/profiles.json", "utf8"));
  const profile = catalogue.profiles.find((entry) => entry.profile_key === "php-laravel");
  assert.equal(profile.lifecycle_status, "pilot");
  assert.equal(profile.compatibility_state, "not-validated");
  assert.equal(profile.implementation.example_repository, "OXY7O/example-app-laravel");
  assert.match(profile.implementation.workflow_reference, /^OXY7O\/platform-workflow\/.+@[a-f0-9]{40}$/);
  assert.equal("demo_repository" in profile.implementation, false);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/example-naming-and-implementation-map.test.mjs` from `platform-governance`.

Expected: FAIL because active files still use `demo`, the schema requires `demo_repository`, and PHP/Laravel remains `planned` without implementation references.

- [ ] **Step 3: Update schema, catalogue, and implementation map**

Change `implementation.required` and its property from `demo_repository` to
`example_repository`. Update every profile object to use that field. Set the
PHP family and PHP/Laravel profile lifecycle to `pilot`; retain PHP/Laravel
compatibility as `not-validated` until template repository, TCV, EVD, and audit
requirements are complete; record:

```json
{
  "workflow_reference": "OXY7O/platform-workflow/.github/workflows/ci-profile-php-laravel.yml@6cd3458cceec36d738265a8b5ebefa5d4e19766c",
  "template_repository": null,
  "example_repository": "OXY7O/example-app-laravel"
}
```

Other profiles remain `planned/not-validated` with
`example_repository: null`.

- [ ] **Step 4: Normalize active governance prose**

Replace conceptual repository `demo-apps` with `example-apps`,
`demo-app-*` with `example-app-*`, and “demo application/teknis” with
“example application/contoh implementasi”. Do not rewrite `CHANGELOG.md`,
historical release notes, or existing superpowers specs/plans.

- [ ] **Step 5: Run governance validation**

Run:

```bash
node --test tests/example-naming-and-implementation-map.test.mjs
npm test
ruby scripts/validate-technology-catalogue.rb catalogues/technology-stack
bash tests/technology-stack/validate-technology-catalogue.sh
git diff --check
```

Expected: all commands exit 0 and the focused tests pass.

- [ ] **Step 6: Commit governance changes**

```bash
git add README.md docs catalogues schemas tests/example-naming-and-implementation-map.test.mjs
git commit -m "docs: standardize example implementation naming"
```

---

### Task 2: Ubah Platform Workflow README Menjadi Portal Lintas Stack

**Files:**
- Modify: `platform-workflow/README.md`
- Modify: `platform-workflow/catalogue/technology-stack.json`
- Create: `platform-workflow/docs/profiles/README.md`
- Create: `platform-workflow/docs/profiles/php-laravel/README.md`
- Move content from: `platform-workflow/docs/THIN-CALLER-PHP-LARAVEL.md`
- Modify: `platform-workflow/tests/documentation-readability.test.mjs`
- Create: `platform-workflow/tests/technology-catalogue-navigation.test.mjs`

**Interfaces:**
- Consumes: governance status and implementation reference from Task 1.
- Produces: general catalogue entry and PHP/Laravel profile landing page used by developers and example onboarding. README status `Available` means implementation available, not governance support/compliance.

- [ ] **Step 1: Replace the old README-focused test with failing portal tests**

```javascript
test("README is a cross-stack workflow portal", () => {
  const readme = read("README.md");
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const text of [
    "Governance baseline", "Katalog tech stack", "Available", "Planned",
    "PHP/Laravel", "Go", ".NET", "Python", "TypeScript/Node.js",
    "Java/Spring Boot", "Cara memilih profile", "Alur onboarding"
  ]) assert.match(readme, new RegExp(escape(text)));
  assert.doesNotMatch(readme, /Profil PHP\/Laravel.*badge/i);
});

test("only available profiles expose implementation links", () => {
  const readme = read("README.md");
  assert.match(readme, /php-laravel[\s\S]+docs\/profiles\/php-laravel\/README\.md/);
  assert.match(readme, /example-app-laravel/);
  assert.doesNotMatch(readme, /example-app-go/);
  assert.doesNotMatch(readme, /example-app-dotnet/);
});
```

- [ ] **Step 2: Run the documentation tests and confirm RED**

Run: `node --test tests/documentation-readability.test.mjs tests/technology-catalogue-navigation.test.mjs`.

Expected: FAIL because README is still PHP/Laravel-specific and no profile landing page exists.

- [ ] **Step 3: Rewrite the root README as the general portal**

Keep exactly four cross-profile badges. Add the governance → workflow →
example flow, persona paths, the six-row catalogue, profile-selection
guidance, thin caller concept, immutable pin rule, artifact/evidence boundary,
deployment boundary, general onboarding flow, and links to profile index.

- [ ] **Step 4: Create the profile index and PHP/Laravel landing page**

`docs/profiles/README.md` mirrors catalogue status without duplicating
technical detail. `docs/profiles/php-laravel/README.md` contains status,
supported workload, prerequisites, workflow table, compatibility matrix,
input/output contract, artifact/evidence, security boundary, thin caller,
troubleshooting, and the eleven-step onboarding checklist from the spec.

Move thin-caller-specific prose into
`docs/profiles/php-laravel/THIN-CALLER.md`, update internal links, and leave no
duplicate active landing page at the old path.

- [ ] **Step 5: Make the machine catalogue reflect current availability**

Set PHP family/profile to `pilot`, retain PHP/Laravel compatibility as
`not-validated`, and add the canonical workflow and example references. Add planned catalogue
entries for Go, .NET, Python, Node.js/TypeScript, and Java without executable
workflow or example links.

- [ ] **Step 6: Run full platform-workflow verification**

Run:

```bash
npm test
npm run lint
npm run typecheck
npm run validate:repository
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit portal and profile documentation**

```bash
git add README.md catalogue docs/profiles tests
git commit -m "docs: add cross-stack workflow catalogue"
```

---

### Task 3: Ubah Demo App Menjadi Example App dan Lengkapi Onboarding

**Files:**
- Modify: `demo-app-laravel/README.md`
- Modify: `demo-app-laravel/compatibility/laravel-12/README.md`
- Modify: `demo-app-laravel/package.json`
- Modify: `demo-app-laravel/package-lock.json`
- Modify: `demo-app-laravel/repository-policy.json`
- Modify: `demo-app-laravel/scripts/validate-repository.mjs`
- Modify: `demo-app-laravel/docs/pilot-result.schema.json`
- Modify: active documentation and evidence URLs under `demo-app-laravel/docs/`
- Modify: `demo-app-laravel/tests/documentation-readability.test.mjs`
- Modify: `demo-app-laravel/tests/repository-validation.test.mjs`
- Create: `demo-app-laravel/tests/example-naming.test.mjs`

**Interfaces:**
- Consumes: PHP/Laravel profile URL and immutable workflow pin from Task 2.
- Produces: canonical `example-app-laravel` package identity, documentation, backlinks, and onboarding steps.

- [ ] **Step 1: Write the failing example naming test**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";

test("active repository content uses example naming", () => {
  assert.equal(JSON.parse(fs.readFileSync("package.json", "utf8")).name, "@oxy7o/example-app-laravel");
  const result = spawnSync("rg", [
    "-n", "demo-app-laravel|Demo App Laravel",
    "README.md", "compatibility", "docs", "package.json", "package-lock.json",
    "repository-policy.json", "scripts", "tests",
    "--glob", "!docs/results/**"
  ], {encoding: "utf8"});
  assert.equal(result.status, 1, result.stdout);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/example-naming.test.mjs`.

Expected: FAIL because package, README, badge, validator output, and schema URL still use the old name.

- [ ] **Step 3: Update identity and technical documentation**

Change package name to `@oxy7o/example-app-laravel`. Update README title,
badge URLs, image names, platform flow, release links, validator output,
schema `$id`, and active links. Add backlink to:

`https://github.com/OXY7O/platform-workflow/blob/main/docs/profiles/php-laravel/README.md`.

Keep historical result payload source URLs unchanged as historical evidence;
add a note in `docs/PILOT-RESULT.md` explaining that pre-rename evidence may
contain the GitHub redirect URL.

- [ ] **Step 4: Add the onboarding checklist and expected outcomes**

README commands state working directory, purpose, and expected result. Add a
checklist covering profile selection, lock file, thin caller, immutable pin,
local validation, pull request, required checks, artifact digest, evidence,
owner, and deployment boundary.

- [ ] **Step 5: Run full example verification**

Run:

```bash
npm test
node scripts/validate-repository.mjs
git diff --check
```

Expected: all commands exit 0 and validator prints
`validated example-app-laravel`.

- [ ] **Step 6: Commit example identity and onboarding**

```bash
git add README.md compatibility docs package.json package-lock.json repository-policy.json scripts tests
git commit -m "docs: rename Laravel reference to example app"
```

---

### Task 4: Rename Repository GitHub dan Verifikasi Navigasi Lintas Repository

**Files:**
- External rename: `OXY7O/demo-app-laravel` → `OXY7O/example-app-laravel`
- Update local remote: local checkout currently named `demo-app-laravel`
- Modify if required: canonical links discovered by final repository-wide scan

**Interfaces:**
- Consumes: committed canonical references from Tasks 1–3.
- Produces: live canonical GitHub URL and working redirect from the old URL.

- [ ] **Step 1: Confirm pre-rename state**

Run:

```bash
gh repo view OXY7O/demo-app-laravel --json nameWithOwner,url,defaultBranchRef
gh repo view OXY7O/example-app-laravel --json nameWithOwner,url
```

Expected: old repository exists on `main`; new repository name is not occupied.

- [ ] **Step 2: Rename the repository through GitHub API**

Run:

```bash
gh api --method PATCH repos/OXY7O/demo-app-laravel -f name=example-app-laravel
```

Expected: response `full_name` equals `OXY7O/example-app-laravel`.

- [ ] **Step 3: Update and verify the local remote**

Run:

```bash
git remote set-url origin https://github.com/OXY7O/example-app-laravel.git
git remote -v
git ls-remote origin HEAD
```

Expected: fetch and push URLs use `example-app-laravel`; remote HEAD resolves.

- [ ] **Step 4: Validate cross-repository links and old-name residue**

Run local Markdown link validation in each repository. Then run:

```bash
rg -n "demo-apps|demo-app-|demo application|Demo App" README.md docs catalogues schemas scripts tests \
  --glob "!CHANGELOG.md" --glob "!docs/superpowers/**" --glob "!docs/results/**"
```

Expected: no active residue. Historical changelog, design history, and evidence
payloads may retain the old value.

- [ ] **Step 5: Verify the redirect and canonical URL**

Run:

```bash
gh repo view OXY7O/example-app-laravel --json nameWithOwner,url
gh api repos/OXY7O/demo-app-laravel --jq .full_name
```

Expected: canonical repository is `OXY7O/example-app-laravel`; old API path
resolves through GitHub rename handling.

---

### Task 5: Version, Pull Request, Merge, dan Release

**Files:**
- Modify: `platform-governance/CHANGELOG.md`
- Modify: `platform-workflow/CHANGELOG.md`
- Modify: `platform-workflow/package.json`
- Modify: `platform-workflow/package-lock.json`
- Modify: `platform-workflow/repository-policy.json`
- Modify: `example-app-laravel/CHANGELOG.md`
- Modify: `example-app-laravel/package.json`
- Modify: `example-app-laravel/package-lock.json`

**Interfaces:**
- Consumes: verified merged-ready commits and canonical repository name.
- Produces: reviewable PRs and patch releases documenting catalogue and naming migration.

- [ ] **Step 1: Add release notes and patch versions**

Use `v1.1.1` for `platform-governance`, `v0.2.2` for `platform-workflow`, and
`v0.2.2` for `example-app-laravel`. Confirm each tag is unused with
`gh release view` before editing metadata. Release notes must state:

- platform workflow README is now cross-stack;
- PHP/Laravel detail moved to a profile landing page;
- planned profiles are not executable;
- example naming replaces demo naming;
- PHP/Laravel CI behavior and deployment boundary are unchanged;
- old GitHub URL redirects but new references must use the canonical URL.

- [ ] **Step 2: Run fresh full verification in all three repositories**

Run:

```bash
# platform-governance
ruby scripts/validate-technology-catalogue.rb catalogues/technology-stack && \
bash tests/technology-stack/validate-technology-catalogue.sh && \
node --test tests/example-naming-and-implementation-map.test.mjs && git diff --check

# platform-workflow
npm test && npm run lint && npm run typecheck && npm run validate:repository && git diff --check

# example-app-laravel
npm test && node scripts/validate-repository.mjs && git diff --check
```

Expected: every command exits 0.

- [ ] **Step 3: Commit release metadata**

```bash
git add CHANGELOG.md package.json package-lock.json repository-policy.json
git commit -m "chore: prepare workflow catalogue release"
```

Use the applicable subset of files in each repository.

- [ ] **Step 4: Push branches and create three PRs**

PR summaries list the governance terminology migration, workflow catalogue,
profile landing page, example rename, onboarding path, test evidence, and
explicit non-change to CI/deployment behavior.

- [ ] **Step 5: Wait for every required GitHub check**

Run `gh pr checks <number> --watch --interval 10` for each PR.

Expected: all required checks pass. Stop on any failure and diagnose before
merge.

- [ ] **Step 6: Squash merge and synchronize main**

Run `gh pr merge <number> --squash --delete-branch`, then switch each local
checkout to `main` and run `git pull --ff-only`.

- [ ] **Step 7: Re-run verification on merged main**

Repeat Step 2 against the exact merged commits. Confirm each working tree is
clean.

- [ ] **Step 8: Publish and verify releases**

Create annotated GitHub releases targeting the exact merged SHA. Verify with:

```bash
gh release view <version> --repo OXY7O/platform-governance --json url,targetCommitish,tagName
gh release view <version> --repo OXY7O/platform-workflow --json url,targetCommitish,tagName
gh release view <version> --repo OXY7O/example-app-laravel --json url,targetCommitish,tagName
```

Expected: each release targets the verified merged commit.
