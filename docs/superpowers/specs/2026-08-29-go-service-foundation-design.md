# Desain Fondasi Go Service

Tanggal: 2026-08-29  
Status: Siap untuk review specification

## 1. Tujuan

Menambahkan implementasi awal profil `go-service` sebagai technology stack
kedua setelah PHP/Laravel. Implementasi mencakup reusable CI, canonical binary
artifact, compatibility validation, dokumentasi onboarding, dan repository
contoh `OXY7O/example-app-go`.

Rilis ini tidak mencakup deployment, OCI image, publikasi package, atau profil
`go-cli`.

## 2. Acuan governance

Implementasi mengikuti `platform-governance@v1.2.0`:

- family: `go`;
- profile: `go-service`;
- lifecycle awal: `pilot`;
- compatibility awal: `not-validated`;
- workload: API dan service;
- dependency manager: Go modules;
- required checks: format, vet, unit test, race test, coverage, vulnerability,
  dan build;
- allowed artifact: binary dan OCI image;
- artifact awal: binary Linux `amd64`;
- supported runner target: Linux `amd64`, sedangkan `arm64` tetap planned.

Status implementasi tersedia tidak boleh ditafsirkan sebagai klaim support,
compatibility verified, atau operational compliance.

## 3. Kebijakan versi

Go 1.26 menjadi canonical lane karena telah lebih matang untuk baseline
enterprise. Go 1.27 menjadi compatibility lane karena merupakan stable release
terbaru pada saat desain disetujui. Baseline awal memin Go 1.26.7 dan Go 1.27.0;
perubahan patch dilakukan melalui catalogue update yang direview dan diuji.

| Lane | Go | Peran | Blocking | Artifact |
|---|---|---|---|---|
| Canonical | 1.26.7 | Seluruh required checks dan canonical build | Ya | Satu binary package |
| Compatibility | 1.27.0 | Seluruh checks dan build validation | Ya | Tidak |

Patch release aktual dalam setiap minor harus mengikuti patch terbaru yang
tersedia pada runner/toolchain yang disetujui. Penambahan Go 1.28 atau perubahan
canonical version memerlukan review lifecycle, bukan perubahan diam-diam.

## 4. Arsitektur repository

```text
platform-governance
  Go family + go-service profile
          |
          v
platform-workflow
  Go family preflight
  go-service reusable workflow
  Go 1.27 compatibility lane
  Go 1.26 canonical binary lane
          |
          v
example-app-go
  thin caller
  minimal net/http API
  test, policy, dan safe evidence
```

### 4.1 Platform workflow

`platform-workflow` menyediakan:

- reusable workflow `ci-profile-go-service.yml`;
- family action untuk dependency, format, vet, unit test, race test, coverage,
  dan vulnerability checks;
- profile action untuk build binary dan packaging;
- input/output contract serta JSON Schema;
- katalog compatibility Go 1.26 dan 1.27;
- safe evidence dan failure taxonomy;
- dokumentasi profile dan thin caller;
- positive dan negative contract tests.

Implementasi family dan profile harus modular. Logic umum seperti contract
digest, safe evidence, artifact manifest, source filtering, dan readiness
calculation menggunakan komponen global yang sudah ada jika kontraknya sesuai.

### 4.2 Example application

Repository private `OXY7O/example-app-go` menggunakan standard library
`net/http`, bukan framework tertentu. Hal ini menjaga profile `go-service`
netral terhadap Gin, Echo, Fiber, Chi, atau framework lain.

Endpoint minimum:

- `GET /health` untuk health/smoke check;
- `GET /api/examples/{id}` untuk deterministic contract test.

Repository memuat `go.mod`, `go.sum`, unit test, coverage, thin caller,
compatibility catalogue, repository policy, README onboarding, serta template
safe evidence. Repository tidak menyimpan application secret dan tidak memiliki
deployment workflow.

## 5. Kontrak caller

Caller hanya boleh memberi input bertipe dan tervalidasi:

- `schema-version`;
- `go-version` canonical;
- `module-path`;
- `working-directory` relatif;
- `binary-name`;
- `main-package`;
- `coverage-threshold`;
- `artifact-retention-days`;
- `runner-class` dari allowlist;
- opt-in compatibility yang diizinkan katalog.

Caller tidak boleh mengirim arbitrary command, shell fragment, absolute path,
path traversal, environment secret, atau `secrets: inherit`. Reusable workflow
dan action harus dipin ke full commit SHA pada consumer.

## 6. Data flow

1. Pull request dibuka atau diperbarui.
2. Thin caller memanggil reusable workflow read-only.
3. Input contract dan digest canonical divalidasi.
4. Go modules diverifikasi dan module graph harus tetap bersih.
5. Format, vet, unit test, race test, coverage, vulnerability, dan build checks
   dijalankan.
6. Go 1.26 membangun canonical Linux `amd64` binary.
7. Go 1.27 menjalankan checks dan build validation tanpa artifact.
8. Canonical binary dipaketkan dengan manifest dan SHA-256 digest.
9. Workflow menghasilkan readiness, failure category, artifact metadata, dan
   safe evidence metadata.

Artifact berstatus `ci-qualified`. Status tersebut bukan `release-ready`, bukan
promotion authorization, dan bukan deployment authorization.

## 7. Artifact contract

Canonical output harus tepat satu archive `.tar.gz` dengan nama
`<binary-name>_<application-version>_linux_amd64.tar.gz` yang memuat:

- executable binary Linux `amd64`;
- manifest machine-readable;
- checksum SHA-256 untuk binary dan archive;
- source commit SHA;
- workflow commit SHA;
- contract digest;
- Go version;
- target `GOOS` dan `GOARCH`;
- module path dan binary name;
- build timestamp terkontrol atau dinormalisasi;
- readiness dan failure category.

Package tidak boleh memuat source secret, `.env`, private key, credential,
workspace metadata, Git metadata, test cache, coverage raw data, atau symbolic
link. Compatibility lane dilarang mengunggah artifact.

## 8. Dependency dan cache

- `go.mod` dan `go.sum` wajib ada;
- `go mod download` tidak boleh mengubah module graph;
- `go mod verify` wajib lulus;
- dependency cache boleh digunakan dengan key yang mengikat OS, architecture,
  Go minor version, dan digest `go.sum`;
- cache bukan evidence dan tidak boleh masuk artifact;
- cache poisoning dibatasi dengan restore key yang sempit serta tidak menerima
  caller-controlled arbitrary key.

## 9. Security boundary

- default permissions hanya `contents: read`;
- tidak ada secrets, OIDC, environment, deployment, atau write permission;
- external actions dipin ke full commit SHA;
- vulnerability check menggunakan `govulncheck` pada versi immutable yang
  dicatat dalam kontrak;
- executable dan archive harus berasal dari source SHA yang sama;
- path harus relatif dan tetap berada dalam repository setelah realpath
  resolution;
- output evidence harus menolak secret-like keys dan private-key material.

## 10. Failure taxonomy

| Category | Contoh |
|---|---|
| `contract-failure` | input, profile, path, atau identity tidak valid |
| `dependency-failure` | `go.sum` hilang, module graph berubah, verify gagal |
| `format-failure` | source tidak lolos `gofmt` |
| `vet-failure` | `go vet` menemukan masalah |
| `test-failure` | unit test gagal |
| `race-failure` | race detector gagal |
| `coverage-failure` | coverage di bawah threshold |
| `vulnerability-failure` | vulnerability melanggar policy |
| `build-failure` | compile/link gagal |
| `artifact-failure` | package, manifest, atau digest tidak valid |
| `platform-failure` | runner/action/platform gagal sebelum hasil valid |

Required check yang `not-run`, timeout, atau tidak menghasilkan output kontrak
harus menghasilkan readiness gagal, bukan dianggap lulus.

## 11. Negative testing

Tes wajib membuktikan penolakan terhadap:

- `go.mod` atau `go.sum` yang hilang;
- module graph yang berubah setelah frozen validation;
- source yang tidak terformat;
- unsupported Go version;
- vulnerability yang melampaui policy;
- caller-controlled command atau shell fragment;
- absolute path, traversal, atau symlink escape;
- duplicate atau contradictory compatibility lane;
- compatibility lane yang mencoba menghasilkan artifact;
- package yang memuat file terlarang;
- evidence yang memuat secret-like field atau private-key material.

Positive tests membuktikan deterministic contract digest, repeatable artifact
digest, tepat satu canonical artifact, compatibility artifactless, dan
readiness/failure classification yang konsisten.

## 12. Dokumentasi dan onboarding

Navigasi canonical:

```text
platform-workflow README
  -> docs/profiles/go-service/README.md
  -> OXY7O/example-app-go
```

README profile menjelaskan fungsi workflow, version matrix, contract input,
checks, artifact, failure taxonomy, troubleshooting, thin caller, dan batas
deployment. README example menjelaskan quick start lokal, expected results,
struktur file, endpoint, adopsi, onboarding checklist, dan evidence.

Landing page umum menampilkan Go Service sebagai `Available` hanya setelah
workflow dan example benar-benar tersedia. `go-cli` tetap `Planned` tanpa
executable link.

## 13. Rollout dan acceptance criteria

Implementasi dapat dinyatakan selesai bila:

- seluruh unit, contract, negative, lint, typecheck, dan repository tests lulus;
- reusable workflow berjalan pada pull request example;
- Go 1.26 menghasilkan tepat satu verified binary artifact;
- Go 1.27 lulus sebagai blocking compatibility lane tanpa artifact;
- artifact digest dan manifest terverifikasi;
- evidence aktual disimpan tanpa secret;
- README dan katalog mengarah ke workflow serta example yang canonical;
- governance catalogue mencatat implementation reference immutable;
- status tetap `pilot/not-validated` sampai assessment formal dilakukan;
- tidak ada deployment atau application secret dalam scope.

## 14. Rilis

Perubahan dibagi menjadi tiga PR bila dependensi implementasi memerlukannya:

1. fondasi Go pada `platform-workflow`;
2. repository `example-app-go` dan pilot evidence;
3. pemetaan implementation reference pada `platform-governance`.

Tag release hanya dibuat pada merged SHA yang telah diverifikasi. Release notes
harus menyatakan capability baru, cara adopsi, migration impact, dan batas bahwa
artifact `ci-qualified` bukan authorization untuk deployment.
