# PHP Laravel Compatibility Lanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan compatibility-only CI untuk beberapa versi PHP/Laravel dengan lock file independen, sementara canonical PHP 8.3 tetap menjadi satu-satunya penghasil application artifact.

**Architecture:** `platform-workflow` memperoleh typed compatibility contract, deterministic matrix generator, dan reusable workflow tanpa packaging. `demo-app-laravel` tetap memakai root Laravel 13 sebagai canonical lane, menambahkan Laravel 12 sebagai multi-lock lane, dan memanggil compatibility workflow melalui matrix yang dihasilkan dari catalogue tervalidasi.

**Tech Stack:** TypeScript 6, Node.js 24 actions, AJV JSON Schema, GitHub reusable workflows, PHP 8.2–8.5, Laravel 12/13, Composer frozen lock files, PHPUnit.

**Spec:** `docs/superpowers/specs/2026-08-29-php-laravel-compatibility-lanes-design.md`

## Global Constraints

- Canonical Laravel 13/PHP 8.3 tetap menghasilkan tepat satu `application-package`.
- Compatibility lane tidak boleh memiliki build-artifact, upload-artifact, environment, deployment, atau secret input.
- Setiap Laravel major memakai `composer.json` dan `composer.lock` independen; CI dilarang menjalankan `composer update`.
- Required lane awal: Laravel 13/PHP 8.4–8.5 dan Laravel 12/PHP 8.2–8.5.
- PHP 8.6 tetap preview non-blocking dan hanya diaktifkan setelah runtime serta dependency lane tersedia.
- Laravel 8/PHP 7.4 tetap `legacy-eol`; eksekusi ditunda sampai exception record dan migration target tersedia.
- Seluruh external action dan reusable workflow harus dipin ke full 40-character commit SHA.
- Permission tetap `contents: read`; `secrets: inherit` dilarang.
- Evidence hanya berisi safe metadata dan tidak mengandung credential, environment value, atau raw log.
- Tidak ada deployment dalam seluruh plan ini.

---

### Task 1: Typed Compatibility Contract

**Files:**
- Create: `contracts/compatibility-input.schema.json`
- Create: `src/validate-compatibility-contract.ts`
- Create: `src/action-validate-compatibility-contract.ts`
- Create: `actions/validate-compatibility-contract/action.yml`
- Modify: `src/contracts/types.ts`
- Modify: `package.json`
- Test: `tests/validate-compatibility-contract.test.mjs`
- Test fixture: `tests/fixtures/contracts/valid-php-laravel-compatibility.json`

**Interfaces:**
- Consumes: raw compatibility JSON dari matrix caller.
- Produces: `CompatibilityInput`, `validateCompatibilityContract(input)`, `calculateCompatibilityContractDigest(input)`, dan action outputs `lane-id`, `blocking`, `contract-digest`.

- [ ] **Step 1: Tulis fixture dan failing contract tests**

```json
{
  "schemaVersion": "1.0",
  "profileKey": "php-laravel",
  "laneId": "laravel-12-php-8.2",
  "frameworkMajor": 12,
  "phpVersion": "8.2",
  "workingDirectory": "compatibility/laravel-12",
  "dependencyMode": "composer-frozen",
  "testCommandProfile": "phpunit",
  "executionMode": "compatibility-only",
  "lifecycle": "security-only",
  "blocking": true
}
```

```javascript
test("accepts a controlled compatibility lane", () => {
  const input = JSON.parse(fs.readFileSync("tests/fixtures/contracts/valid-php-laravel-compatibility.json"));
  assert.equal(validateCompatibilityContract(input).laneId, "laravel-12-php-8.2");
  assert.match(calculateCompatibilityContractDigest(input), /^sha256:[a-f0-9]{64}$/);
});

test("rejects commands and path traversal", () => {
  const input = JSON.parse(fs.readFileSync("tests/fixtures/contracts/valid-php-laravel-compatibility.json"));
  assert.throws(() => validateCompatibilityContract({...input, command: "composer update"}), /invalid/i);
  assert.throws(() => validateCompatibilityContract({...input, workingDirectory: "../outside"}), /invalid/i);
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `npm run build && node --test tests/validate-compatibility-contract.test.mjs`  
Expected: FAIL karena module dan schema compatibility belum tersedia.

- [ ] **Step 3: Implementasikan schema dan validator**

Schema menggunakan `additionalProperties: false`, enum lifecycle `active|security-only|preview|legacy-eol`, enum execution mode `compatibility-only|exception-only`, PHP pattern `^[0-9]+\.[0-9]+$`, serta relative working-directory pattern yang menolak absolute path dan `..`.

Tambahkan tipe berikut:

```typescript
export interface CompatibilityInput {
  schemaVersion: "1.0";
  profileKey: "php-laravel";
  laneId: string;
  frameworkMajor: number;
  phpVersion: string;
  workingDirectory: string;
  dependencyMode: "composer-frozen";
  testCommandProfile: "phpunit" | "pest";
  executionMode: "compatibility-only" | "exception-only";
  lifecycle: "active" | "security-only" | "preview" | "legacy-eol";
  blocking: boolean;
}
```

Validator mengikuti canonical JSON hashing yang sudah dipakai `validate-contract.ts`; jangan menerima callback atau command dari caller.

- [ ] **Step 4: Tambahkan Node action wrapper dan bundle script**

Action manifest menerima `contract` dan menghasilkan `lane-id`, `blocking`, serta `contract-digest`. Tambahkan entry `bundle:all`:

```json
"ncc build lib/action-validate-compatibility-contract.js -o dist/validate-compatibility-contract"
```

- [ ] **Step 5: Jalankan test dan bundle**

Run: `npm run bundle:all && npm test && npm run lint && npm run typecheck`  
Expected: seluruh test PASS dan `dist/validate-compatibility-contract/index.js` tersedia.

- [ ] **Step 6: Commit**

```bash
git add contracts src actions dist package.json tests
git commit -m "feat: validate PHP Laravel compatibility contracts"
```

### Task 2: Deterministic Matrix Generator

**Files:**
- Create: `contracts/compatibility-catalogue.schema.json`
- Create: `src/generate-compatibility-matrix.ts`
- Create: `src/action-generate-compatibility-matrix.ts`
- Create: `actions/generate-compatibility-matrix/action.yml`
- Modify: `package.json`
- Test: `tests/generate-compatibility-matrix.test.mjs`
- Test fixture: `tests/fixtures/compatibility/php-laravel.json`

**Interfaces:**
- Consumes: validated catalogue JSON dan `includePreview: boolean`.
- Produces: `generateCompatibilityMatrix(catalogue, options): {include: CompatibilityInput[]}` dan action output `matrix-json`.

- [ ] **Step 1: Tulis failing matrix tests**

```javascript
test("generates required lanes deterministically without canonical artifact", () => {
  const catalogue = JSON.parse(fs.readFileSync("tests/fixtures/compatibility/php-laravel.json"));
  const matrix = generateCompatibilityMatrix(catalogue, {includePreview: false});
  assert.deepEqual(matrix.include.map((lane) => lane.laneId), [
    "laravel-12-php-8.2",
    "laravel-12-php-8.3",
    "laravel-12-php-8.4",
    "laravel-12-php-8.5",
    "laravel-13-php-8.4",
    "laravel-13-php-8.5"
  ]);
  assert.equal(matrix.include.some((lane) => lane.executionMode === "canonical-artifact"), false);
});

test("preview is opt-in and non-blocking", () => {
  const catalogue = JSON.parse(fs.readFileSync("tests/fixtures/compatibility/php-laravel.json"));
  const preview = generateCompatibilityMatrix(catalogue, {includePreview: true}).include.find((lane) => lane.phpVersion === "8.6");
  assert.equal(preview?.blocking, false);
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `npm run build && node --test tests/generate-compatibility-matrix.test.mjs`  
Expected: FAIL karena generator belum tersedia.

- [ ] **Step 3: Implementasikan schema dan pure generator**

Generator harus memvalidasi catalogue sebelum transformasi, mengabaikan canonical-artifact dan legacy-eol pada trigger reguler, menolak duplicate `laneId`, lalu mengurutkan berdasarkan `frameworkMajor`, PHP semantic numeric order, dan `laneId`.

```typescript
export interface MatrixOptions {includePreview: boolean}
export interface CompatibilityMatrix {include: CompatibilityInput[]}
export function generateCompatibilityMatrix(catalogue: unknown, options: MatrixOptions): CompatibilityMatrix;
```

- [ ] **Step 4: Tambahkan action wrapper**

Action menerima `catalogue-path` dan `include-preview`, membaca file dari caller checkout, lalu menulis compact JSON ke output `matrix-json`. Path wajib relative dan tidak boleh keluar repository.

- [ ] **Step 5: Jalankan bundle dan test**

Run: `npm run bundle:all && npm test && npm run lint && npm run typecheck`  
Expected: PASS dan generator menghasilkan urutan yang sama pada setiap run.

- [ ] **Step 6: Commit**

```bash
git add contracts src actions dist package.json tests
git commit -m "feat: generate governed Laravel compatibility matrix"
```

### Task 3: Reusable Compatibility-Only Workflow

**Files:**
- Create: `.github/workflows/ci-compatibility-php-laravel.yml`
- Create: `contracts/compatibility-output.schema.json`
- Modify: `scripts/validate-repository.mjs`
- Create: `scripts/set-platform-workflow-pin.mjs`
- Test: `tests/compatibility-workflow-contract.test.mjs`

**Interfaces:**
- Consumes: `contract-json`, `php-version`, `working-directory`, `test-profile`.
- Produces: `readiness`, `failure-category`, `contract-digest`, `lock-digest`, `evidence-metadata`; tidak menghasilkan artifact output.

- [ ] **Step 1: Tulis failing workflow contract test**

```javascript
test("compatibility workflow is read-only and artifactless", () => {
  const workflow = parse(fs.readFileSync(".github/workflows/ci-compatibility-php-laravel.yml", "utf8"));
  assert.deepEqual(workflow.permissions, {contents: "read"});
  const source = JSON.stringify(workflow);
  assert.doesNotMatch(source, /upload-artifact|build-application-package|environment|secrets:inherit|deploy/i);
  assert.ok(workflow.on.workflow_call.outputs["contract-digest"]);
  assert.equal(workflow.on.workflow_call.outputs["artifact-id"], undefined);
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `node --test tests/compatibility-workflow-contract.test.mjs`  
Expected: FAIL karena workflow belum tersedia.

- [ ] **Step 3: Implementasikan reusable workflow**

Workflow memakai `ubuntu-24.04`, checkout caller, private action contract validator, `setup-php`, `php-family-check`, dan `laravel-profile-check`. Semua private action dipin ke implementation commit yang sudah berada permanen pada `main`. Normalized evidence memuat lane ID, framework major, PHP version, lifecycle, blocking, source SHA, workflow SHA, contract digest, lock digest, runner image, dan conclusion.

- [ ] **Step 4: Perluas repository validator**

Validator harus memastikan workflow compatibility:

- tidak mempunyai output dengan nama yang mengandung `artifact`;
- tidak memakai `actions/upload-artifact`;
- tidak mempunyai key `environment` atau `secrets`;
- seluruh external `uses` dipin full SHA.

- [ ] **Step 5: Jalankan validasi**

Run: `npm test && npm run lint && npm run typecheck && npm run validate:repository`  
Expected: PASS dan validator melaporkan empat workflow tervalidasi.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows contracts scripts tests
git commit -m "feat: add artifactless Laravel compatibility workflow"
```

### Task 4: Platform Workflow Release

**Files:**
- Modify: `repository-policy.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/THIN-CALLER-PHP-LARAVEL.md`
- Test: `tests/repository-contract.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3 yang seluruhnya hijau.
- Produces: immutable `platform-workflow` release yang menyediakan canonical dan compatibility workflow.

- [ ] **Step 1: Tulis failing release contract test**

Naikkan expected `repository-policy.release` ke versi minor berikutnya karena terdapat capability baru, bukan sekadar bug fix. Bila baseline saat eksekusi adalah `v0.1.2`, target menjadi `v0.2.0`.

Run: `node --test tests/repository-contract.test.mjs`  
Expected: FAIL karena metadata masih menunjuk release sebelumnya.

- [ ] **Step 2: Perbarui metadata dan dokumentasi**

Set `package.json`, lock file, policy, README, dan changelog ke `v0.2.0`. Dokumentasikan canonical caller dan compatibility caller secara terpisah serta tegaskan bahwa compatibility output bukan deployable artifact.

- [ ] **Step 3: Jalankan gate release**

Run: `npm ci && npm run bundle:all && npm test && npm run lint && npm run typecheck && npm run validate:repository && git diff --check`  
Expected: seluruh command exit 0.

- [ ] **Step 4: Commit, push, PR, dan release**

```bash
git add .
git commit -m "chore: prepare compatibility workflow v0.2.0"
git push -u origin feature/php-laravel-compatibility
gh pr create --base main --head feature/php-laravel-compatibility --title "feat: add PHP Laravel compatibility lanes"
```

Setelah required check hijau dan review disetujui, squash merge lalu buat release `v0.2.0`. Catat merge commit SHA untuk caller demo.

### Task 5: Laravel 12 Multi-Lock Lane

**Repository:** `OXY7O/demo-app-laravel`

**Files:**
- Create: `compatibility/laravel-12/composer.json`
- Create: `compatibility/laravel-12/composer.lock`
- Create: `compatibility/laravel-12/phpunit.xml`
- Create: `compatibility/laravel-12/bootstrap/app.php`
- Create: `compatibility/laravel-12/app/Domain/Example.php`
- Create: `compatibility/laravel-12/app/Http/Controllers/HealthController.php`
- Create: `compatibility/laravel-12/app/Http/Controllers/ExampleController.php`
- Create: `compatibility/laravel-12/routes/api.php`
- Create: `compatibility/laravel-12/tests/Unit/ExampleTest.php`
- Create: `compatibility/laravel-12/tests/Feature/HealthEndpointTest.php`
- Create: `compatibility/laravel-12/tests/Feature/ExampleEndpointTest.php`
- Create: `compatibility/laravel-12/compatibility-contract.json`
- Test: `tests/laravel-12-lane.test.mjs`

**Interfaces:**
- Consumes: Laravel 12 dan PHP constraint `^8.2`, frozen Composer lock.
- Produces: self-contained working directory `compatibility/laravel-12` dengan Composer preset `test:phpunit` dan endpoint contract yang sama dengan canonical lane.

- [ ] **Step 1: Tulis failing structural lane test**

```javascript
test("Laravel 12 lane is frozen and compatibility-only", () => {
  const composer = JSON.parse(fs.readFileSync("compatibility/laravel-12/composer.json"));
  const contract = JSON.parse(fs.readFileSync("compatibility/laravel-12/compatibility-contract.json"));
  assert.equal(composer.require.php, "^8.2");
  assert.match(composer.require["laravel/framework"], /^\^12/);
  assert.ok(composer.scripts["test:phpunit"]);
  assert.equal(contract.executionMode, "compatibility-only");
  assert.equal(contract.workingDirectory, "compatibility/laravel-12");
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `node --test tests/laravel-12-lane.test.mjs`  
Expected: FAIL karena lane belum tersedia.

- [ ] **Step 3: Scaffold Laravel 12 menggunakan PHP 8.2**

Bangun temporary PHP 8.2 test image dengan extension yang sama seperti canonical. Jalankan:

```bash
composer create-project laravel/laravel:^12.0 compatibility/laravel-12 --no-interaction
```

Pastikan Composer berjalan di PHP 8.2 sehingga lock file tidak memilih package yang membutuhkan PHP lebih baru. Hapus frontend dependency dan generator instruction yang tidak diperlukan API lane.

- [ ] **Step 4: Tulis failing PHP tests untuk endpoint contract**

Gunakan expected JSON yang sama dengan canonical:

```php
$this->getJson('/api/health')->assertOk()->assertExactJson(['status' => 'ok']);
$this->getJson('/api/examples/7')->assertOk()->assertExactJson(['data' => ['id' => 7, 'name' => 'example-7']]);
```

Run pada PHP 8.2 dan pastikan FAIL karena route/domain belum ada.

- [ ] **Step 5: Implementasikan API minimal dan Composer preset**

Tambahkan domain/controllers/routes serta:

```json
"test:phpunit": [
  "@php -r \"is_dir('build/coverage') || mkdir('build/coverage', 0777, true);\"",
  "@php artisan test --coverage-clover build/coverage/clover.xml --min=80"
]
```

- [ ] **Step 6: Verifikasi PHP 8.2–8.5**

Untuk setiap versi, jalankan frozen install dan test pada container version-specific. Expected: semua required runtime PASS dan lock file digest tidak berubah.

- [ ] **Step 7: Commit**

```bash
git add compatibility/laravel-12 tests/laravel-12-lane.test.mjs
git commit -m "feat: add Laravel 12 compatibility lane"
```

### Task 6: Catalogue dan Thin Compatibility Caller

**Repository:** `OXY7O/demo-app-laravel`

**Files:**
- Modify: `compatibility/php-laravel.json`
- Modify: `compatibility/php-laravel.schema.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/validate-repository.mjs`
- Modify: `repository-policy.json`
- Test: `tests/compatibility-catalogue.test.mjs`
- Test: `tests/thin-caller.test.mjs`

**Interfaces:**
- Consumes: `platform-workflow v0.2.0` full SHA dan Laravel 12 lane.
- Produces: prepare-matrix job, required compatibility matrix job, dan canonical artifact job yang tetap tunggal.

- [ ] **Step 1: Tulis failing catalogue/caller tests**

```javascript
test("catalogue declares executable lanes", () => {
  const data = JSON.parse(fs.readFileSync("compatibility/php-laravel.json"));
  assert.equal(data.matrixExpansion.status, "enabled");
  assert.equal(data.lanes.filter((lane) => lane.blocking).length, 6);
});

test("caller separates canonical artifact and compatibility matrix", () => {
  const workflow = JSON.parse(fs.readFileSync(".github/workflows/ci.yml"));
  assert.ok(workflow.jobs["canonical-artifact"]);
  assert.ok(workflow.jobs["prepare-compatibility"]);
  assert.ok(workflow.jobs.compatibility.strategy.matrix);
  assert.equal(workflow.jobs.compatibility.secrets, undefined);
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `node --test tests/compatibility-catalogue.test.mjs tests/thin-caller.test.mjs`  
Expected: FAIL karena matrix masih planned dan caller hanya mempunyai canonical job lama.

- [ ] **Step 3: Aktifkan catalogue lane**

Tambahkan explicit lane objects untuk Laravel 13/PHP 8.4–8.5 dan Laravel 12/PHP 8.2–8.5. PHP 8.6 tetap `eligible: false` sampai runtime/dependency tervalidasi. PHP 7.4 tetap `trigger: workflow_dispatch-exception` dan tidak masuk regular matrix.

- [ ] **Step 4: Implementasikan caller**

`prepare-compatibility` checkout source lalu memanggil immutable `generate-compatibility-matrix` action. `compatibility` menggunakan:

```yaml
strategy:
  fail-fast: false
  matrix: ${{ fromJSON(needs.prepare-compatibility.outputs.matrix-json) }}
continue-on-error: ${{ !matrix.blocking }}
uses: OXY7O/platform-workflow/.github/workflows/ci-compatibility-php-laravel.yml@7a7792d98a14089c962876b90934b10ce89cc3b8
```

Nilai contoh pada snippet adalah baseline `v0.1.2` yang sudah ada. Setelah mengedit struktur caller, jalankan script berikut agar seluruh referensi `OXY7O/platform-workflow` diganti ke target commit release aktual:

```javascript
import fs from "node:fs";

const sha = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("full platform workflow SHA is required");
const file = ".github/workflows/ci.yml";
const source = fs.readFileSync(file, "utf8");
const updated = source.replaceAll(
  /(OXY7O\/platform-workflow\/[^"'\s]+)@[a-f0-9]{40}/g,
  `$1@${sha}`,
);
if (updated === source) throw new Error("no platform workflow reference updated");
fs.writeFileSync(file, updated);
```

```bash
PLATFORM_WORKFLOW_SHA="$(gh release view v0.2.0 --repo OXY7O/platform-workflow --json targetCommitish --jq .targetCommitish)"
node scripts/set-platform-workflow-pin.mjs "$PLATFORM_WORKFLOW_SHA"
```

- [ ] **Step 5: Perluas validator**

Validator memastikan canonical job hanya satu, compatibility job tidak memiliki artifact/deployment/secrets, seluruh lane directory dan lock file tersedia, serta caller/catalogue values sama.

- [ ] **Step 6: Jalankan local validation**

Run: `npm ci && npm test && node scripts/validate-repository.mjs && git diff --check`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add compatibility .github/workflows/ci.yml scripts tests repository-policy.json
git commit -m "ci: add governed Laravel compatibility matrix"
```

### Task 7: End-to-End Matrix Pilot dan Evidence

**Repository:** `OXY7O/demo-app-laravel`

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `docs/results/YYYY-MM-DD-php-laravel-compatibility-pilot.json`
- Modify: `docs/pilot-result.schema.json`
- Test: `tests/pilot-documentation.test.mjs`

**Interfaces:**
- Consumes: GitHub Actions canonical output dan seluruh required compatibility job result.
- Produces: evidence record matrix aktual, demo app release minor, dan gap list bila ada.

- [ ] **Step 1: Push branch dan buka draft PR**

```bash
git push -u origin feature/php-laravel-compatibility
gh pr create --draft --base main --head feature/php-laravel-compatibility --title "feat: validate PHP Laravel compatibility lanes"
```

- [ ] **Step 2: Tunggu seluruh check**

Run:

```bash
DEMO_PR_NUMBER="$(gh pr view feature/php-laravel-compatibility --json number --jq .number)"
gh pr checks "$DEMO_PR_NUMBER" --watch --interval 10
```

Expected: canonical artifact, six required compatibility lanes, dan repository validation PASS. Preview/legacy tidak dijalankan pada PR reguler.

- [ ] **Step 3: Verifikasi canonical artifact tetap tunggal**

Run GitHub Actions artifacts API untuk run canonical. Expected: tepat satu artifact dengan nama `ART-php-laravel-*`; tidak ada artifact dari compatibility workflow runs.

- [ ] **Step 4: Catat matrix evidence**

Record memuat:

```json
{
  "status": "passed",
  "canonicalArtifactCount": 1,
  "requiredLaneCount": 6,
  "requiredLanesPassed": 6,
  "previewLanesExecuted": 0,
  "legacyLanesExecuted": 0,
  "deploymentExecuted": false,
  "gaps": []
}
```

Tambahkan per-lane source SHA, workflow SHA, PHP version, framework major, contract digest, lock digest, conclusion, run URL, dan evidence reference. Jangan menyimpan raw log atau downloaded artifact.

- [ ] **Step 5: Jalankan final verification**

Run: `npm test && node scripts/validate-repository.mjs` dan seluruh PHP lane tests pada container masing-masing. Expected: PASS.

- [ ] **Step 6: Commit evidence dan final review**

```bash
git add README.md CHANGELOG.md docs tests
git commit -m "docs: record Laravel compatibility matrix pilot"
git push
```

Ubah PR menjadi ready hanya ketika canonical dan enam required lanes hijau, artifact count tepat satu, dan tidak ada gap blocking.

- [ ] **Step 7: Merge dan release**

Setelah persetujuan pengguna, squash merge dan buat release minor `demo-app-laravel v0.2.0`. Release notes mencantumkan platform workflow SHA, lane matrix tervalidasi, evidence record, batas preview/legacy, dan tanpa deployment.

### Task 8: Deferred Preview dan Legacy Activation Records

**Files:**
- Create: `docs/PREVIEW-LANE-ACTIVATION.md`
- Create: `docs/LEGACY-LANE-EXCEPTION.md`
- Create: `docs/examples/legacy-lane-exception.example.json`
- Create: `docs/legacy-lane-exception.schema.json`
- Test: `tests/lane-activation-documentation.test.mjs`

**Interfaces:**
- Consumes: PHP 8.6 availability evidence atau approved legacy exception.
- Produces: controlled future activation path; tidak mengaktifkan lane pada plan ini.

- [ ] **Step 1: Tulis failing documentation contract test**

```javascript
test("legacy example requires migration and expiration controls", () => {
  const record = JSON.parse(fs.readFileSync("docs/examples/legacy-lane-exception.example.json"));
  assert.equal(record.status, "example");
  assert.match(record.exceptionId, /^EXC-/);
  assert.ok(record.migrationTarget);
  assert.ok(record.expirationDate);
  assert.equal(record.regularPullRequestEnabled, false);
});
```

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `node --test tests/lane-activation-documentation.test.mjs`  
Expected: FAIL karena example belum tersedia.

- [ ] **Step 3: Buat schema, example, dan activation guides**

Preview guide mewajibkan runtime availability, dependency resolution, non-blocking initial run, dan review sebelum required promotion. Legacy guide mewajibkan approved exception ID, sponsor, business justification, migration target, expiration date, manual trigger, dan evidence reference.

- [ ] **Step 4: Jalankan test dan commit**

Run: `npm test && node scripts/validate-repository.mjs`  
Expected: PASS.

```bash
git add docs tests
git commit -m "docs: define preview and legacy lane activation"
```
