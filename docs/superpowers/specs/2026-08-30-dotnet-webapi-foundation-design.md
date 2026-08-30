# .NET Web API Foundation Design

**Status:** Disetujui untuk implementation planning  
**Tanggal:** 2026-08-30  
**Repository utama:** `OXY7O/platform-workflow`

## Tujuan

Menambahkan reusable CI dan canonical application package untuk profile
`.NET Web API`, membuktikannya melalui private repository
`OXY7O/example-app-dotnet`, lalu memetakan referensi immutable ke
`platform-governance` tanpa membuat klaim support atau operational compliance.

## Keputusan yang dikunci

- Family adalah `.NET`; profile pertama hanya `dotnet-webapi`.
- `.NET Worker` tetap `planned`.
- Target framework canonical adalah `net10.0`.
- Canonical SDK adalah exact `.NET SDK 10.0.110`, dikunci melalui `global.json`.
- Canonical target adalah framework-dependent `linux-x64`.
- Canonical lane menghasilkan tepat satu deterministic `.tar.gz` application
  package.
- Compatibility memakai exact `.NET SDK
  11.0.100-preview.6.26359.118`, opt-in, non-blocking, dan artifactless.
- .NET 8 hanya masuk lifecycle/exception matrix berikutnya; tidak menjadi lane
  example pertama.
- Example menggunakan ASP.NET Core controller-based Web API.
- CI, artifact, dan evidence saja; tidak ada deployment.

Dasar lifecycle: .NET 10 adalah LTS sampai 14 November 2028. .NET 11 masih
preview dan diperkirakan stabil November 2026. Versi servicing dan preview harus
direview kembali sebelum implementasi bila sumber resmi Microsoft berubah.

## Arsitektur

```text
consumer thin caller
  -> typed .NET Web API contract
  -> reusable .NET family checks
  -> reusable Web API profile checks
  -> framework-dependent publish (linux-x64)
  -> deterministic application package + manifest + digest
  -> exactly one canonical artifact + Safe evidence metadata

  -> optional .NET 11 preview compatibility
       -> non-blocking
       -> artifactless
       -> no readiness/compliance claim
```

Family workflow menampung kontrol yang dapat digunakan kembali oleh Web API dan
profile .NET berikutnya. Profile workflow hanya menambah validasi ASP.NET Core,
publish, packaging, dan compatibility orchestration.

## Typed caller contract

Canonical caller hanya boleh mengirim field terkontrol:

- schema, governance, dan catalogue version;
- profile key `dotnet-webapi`;
- SDK version `10.0.110`;
- target framework `net10.0`;
- solution path, project path, dan test project path relatif;
- assembly/artifact name yang aman;
- runtime identifier `linux-x64`;
- publish mode `framework-dependent`;
- coverage threshold 0–100;
- retention 1–30 hari;
- evidence mode `safe-metadata`;
- extension dari allowlist.

Schema memakai `additionalProperties: false`. Caller tidak boleh mengirim shell
command, MSBuild property bebas, NuGet source, absolute path, traversal,
credential, secret, environment, deployment instruction, custom cache key, atau
arbitrary test filter.

## Family checks

Urutan canonical family checks:

1. validasi `global.json`, solution, project, test project, dan lock files;
2. verifikasi exact SDK `10.0.110` dan target framework `net10.0`;
3. `dotnet restore --locked-mode` tanpa interactive credential flow;
4. memastikan restore/tidy equivalent tidak mengubah dependency state;
5. `dotnet format --verify-no-changes --no-restore`;
6. `dotnet build --no-restore` dengan configuration `Release`;
7. `dotnet test --no-build` dengan deterministic test result dan coverage;
8. coverage minimum dari machine-readable result;
9. vulnerable dan deprecated transitive dependency check;
10. normalized result dan dependency digest.

Perintah dan argument berasal dari implementation workflow, bukan caller.
Private feed onboarding kelak memakai konfigurasi terpisah; tidak ada credential
atau feed URL sensitif pada kontrak kloter ini.

## Web API profile dan example

Profile memvalidasi bahwa project memakai Web SDK, target `net10.0`, dan dapat
dipublish framework-dependent untuk `linux-x64` tanpa self-contained runtime.

`example-app-dotnet` memakai struktur:

```text
src/Example.Api/
tests/Example.Api.Tests/
```

API menyediakan:

- `GET /health` dengan response `{"status":"ok"}`;
- `GET /api/examples/{id}` dengan deterministic JSON;
- controlled 400/404/405 responses;
- unit/integration test tanpa database, authentication, broker, atau cloud SDK.

Dependency test dikunci melalui `packages.lock.json`. Example memiliki thin
caller immutable, compatibility catalogue, repository policy, traceability,
onboarding, troubleshooting, schema, dan actual Safe evidence.

## Canonical artifact

`dotnet publish` menghasilkan framework-dependent output untuk `linux-x64`.
Packager hanya menerima verified publish directory, menolak symlink dan file
sensitif, menormalisasi metadata archive, serta membuat:

`<artifact-name>_<application-version>_net10.0_linux-x64.tar.gz`

Archive berisi published application dan `manifest.json`, tanpa source, test
result, coverage raw file, `.git`, local settings sensitif, NuGet cache, secret,
credential, atau runtime self-contained.

Manifest mencatat artifact ID/name/type, application version, source SHA,
workflow SHA, contract/dependency digest, SDK, target framework, RID, publish
mode, normalized file list, per-file digest, retention, dan deterministic
timestamp. Output berstatus `ci-qualified`, bukan release-ready atau deployment
authorization.

## Compatibility lane

Compatibility catalogue memiliki satu preview lane:

- SDK `11.0.100-preview.6.26359.118`;
- target tetap `net10.0`;
- execution mode `compatibility-only`;
- `eligible` hanya ketika preview opt-in aktif;
- `blocking: false`;
- `artifact: false`.

Generator harus menolak duplicate identity, identity/version contradiction,
blocking preview, artifact-enabled preview, absolute catalogue path, traversal,
dan symlink escape. Preview failure tidak mengubah canonical readiness.

## Permission dan keamanan

- Reusable workflow dan caller hanya `contents: read`.
- Tidak ada `id-token: write`, secret, `secrets: inherit`, environment, atau
  deployment.
- External actions dipin ke full commit SHA.
- NuGet restore non-interactive dan menggunakan source default yang diizinkan
  kloter ini.
- Diagnostic dan evidence tidak boleh membawa credential, private feed URL,
  path mesin, environment value, atau raw response sensitif.
- Artifact upload tepat satu dan hanya pada canonical success.

## Failure taxonomy

Kegagalan dinormalisasi menjadi:

- `contract` atau `configuration`;
- `dependency`;
- `quality`;
- `test` atau `coverage`;
- `security`;
- `build`;
- `artifact`;
- `platform`.

Setiap failure menghasilkan diagnostic aman dan actionable. Required canonical
failure menggagalkan readiness; preview failure hanya dicatat sebagai hasil
compatibility non-blocking.

## Dokumentasi dan lifecycle

Portal `platform-workflow` menampilkan .NET Web API sebagai `In progress` ketika
workflow tersedia tetapi example belum selesai. Status menjadi `Available`
setelah workflow release, example pilot, actual evidence, example release, dan
navigasi lengkap tersedia.

`platform-governance` kemudian mengubah .NET family dan Web API menjadi `pilot`,
menautkan workflow SHA serta example, tetapi mempertahankan compatibility
`not-validated`. .NET Worker tetap planned.

## Pengujian

`platform-workflow` harus memiliki positive dan negative test untuk:

- typed contract dan digest stability;
- locked dependency state dan unsafe caller input;
- family/profile executors;
- deterministic package dan prohibited files;
- preview matrix invariants;
- workflow permission, immutable refs, one artifact, dan no deployment;
- catalogue/documentation navigation;
- regression seluruh PHP/Laravel dan Go contracts.

`example-app-dotnet` harus lulus format, locked restore, build, unit/integration
test, coverage, dependency security check, repository contract tests, canonical
CI, preview compatibility, artifact verification, dan evidence validation.

## Release sequence

1. Implementasikan dan rilis `platform-workflow` minor version berikutnya.
2. Buat private `OXY7O/example-app-dotnet` dan pin workflow release SHA.
3. Jalankan pilot, verifikasi artifact, catat actual Safe evidence.
4. Merge dan rilis example `v0.1.0`.
5. Perbarui portal workflow melalui patch release bila diperlukan.
6. Petakan implementasi ke `platform-governance` minor release berikutnya.
7. Audit ulang navigasi, SHA, permission, artifact count, dan scope boundary.

## Di luar scope

- .NET Worker, library, atau desktop profile;
- .NET 8 legacy execution;
- self-contained, single-file, NativeAOT, Windows, atau arm64 artifact;
- OCI image, SBOM, signing, package publication;
- private NuGet feed credential flow;
- database, EF Core, authentication, authorization, broker, atau cloud SDK;
- deployment, promotion, release production, environment approval, dan rollback.
