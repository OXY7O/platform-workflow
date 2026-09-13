# Changelog

Dokumen ini menjelaskan perubahan yang berdampak pada pengguna `platform-workflow`. Istilah teknis dipertahankan ketika merupakan bagian dari kontrak platform.

## Unreleased

### Laravel container-host CD

- menambahkan kontrak build OCI dan publication ke private GHCR dengan immutable
  digest, SBOM, serta provenance;
- menambahkan kontrak deployment development, executor Docker Compose melalui
  wrapper terkontrol, health check `/up`, LKG, dan rollback;
- menambahkan safe deployment evidence yang menolak secret, network detail,
  raw command, dan nilai environment;
- menambahkan reusable workflow development dengan least privilege, explicit
  secret mapping, concurrency serialization, dan evidence pada setiap hasil;
- capability masih `pilot` dan actual verification masih `pending`.

## [0.6.0] - 2026-09-12

### Runtime PHP/Laravel

- canonical PHP family dan Laravel packaging memakai image
  `platform-runtime-images@v0.1.1` yang dikunci ke digest GHCR approved;
- menghapus instalasi PHP native dari canonical jobs dan memverifikasi identitas
  runtime sebelum check dijalankan;
- mencatat runtime logical ID, release, katalog sumber, dan digest pada katalog
  tech stack serta safe evidence metadata.
- menyelaraskan kontrak caller dan manifest artefak Laravel ke
  `platform-governance@v1.5.0` dan catalogue `1.2.0`;
- mengaktifkan Xdebug coverage hanya pada job package yang memerlukannya;
- mem-pin katalog PHP/Laravel ke implementasi immutable
  `1d51c025059c9bc3bca4fd2ed6c09b9627129399` yang telah lulus uji nyata.

### Dokumentasi

- menjelaskan boundary integrasi dengan `platform-provisioning`;
- menetapkan approved bundle, immutable thin caller, certification reuse, dan
  sandbox validation sebagai proses di luar ownership workflow;
- menegaskan bahwa example adalah certification fixture, bukan template atau
  sumber repository developer.

### Verifikasi

- 95 pengujian repository, lint, typecheck, validasi kontrak, dan audit
  dependency lulus;
- canonical family, canonical package, coverage, artifact, serta enam lane
  kompatibilitas lulus pada `OXY7O/example-app-laravel`;
- status governance tetap `pilot` dan compatibility tetap `not-validated`
  sampai TCV, evidence formal, audit organisasi, dan remediation diselesaikan.

### Batas

- perubahan v0.6.0 mencakup CI, artifact, safe evidence, dan runtime PHP;
- deployment, renderer, dan repository provisioning automation belum tersedia.

## [0.5.3] - 2026-08-31

### Dokumentasi dan katalog

- menandai `.NET Web API` sebagai `Available` setelah reusable workflow,
  example repository, actual pilot evidence, dan release contoh tersedia;
- menautkan `OXY7O/example-app-dotnet@v0.1.0`, actual pilot run, serta evidence
  artifact yang sudah diverifikasi dari portal dan landing page profile;
- memperbarui thin caller ke immutable workflow pin `451f980e3f4b9d926b7b340b42f7f611d75db1d2`.

### Batas

- tidak ada perubahan executable contract setelah `v0.5.2`;
- lifecycle tetap `pilot`, compatibility tetap `not-validated`, dan deployment
  tetap tidak tersedia;
- `Available` bukan klaim `supported` atau `operationally compliant`.

## [0.5.2] - 2026-08-30

### Diperbaiki

- mengizinkan tahap publish membangun keluaran khusus runtime setelah locked
  restore, sehingga framework-dependent `linux-x64` package tidak bergantung
  pada keluaran build umum;
- memasang SDK canonical dan preview sebelum cache resolution, lalu memilih SDK
  preview secara eksplisit hanya untuk compatibility execution;
- memindahkan sifat non-blocking ke langkah pemeriksaan preview sehingga hasil
  gagal tetap tercatat pada normalized evidence tanpa menghasilkan failing PR
  check atau artifact.

### Batas

- canonical CI, test, package, dan artifact tetap blocking;
- preview tetap opt-in, artifactless, dan bukan dasar release atau deployment;
- kontrak caller dan permission `contents: read` tidak berubah.

## [0.5.1] - 2026-08-30

### Diperbaiki

- menyesuaikan noun-first .NET 10 CLI menjadi
  `dotnet package list --project <project>` untuk vulnerability dan deprecated
  package checks;
- menambahkan `--no-restore` agar dependency audit memakai graph yang telah
  berhasil melalui locked restore;
- memperketat executor test pada exact `--project` argument dan membuktikan
  patch terhadap SDK `10.0.110` serta example nyata.

### Batas

- kontrak caller, artifact format, preview policy, permission, dan scope tanpa
  deployment tidak berubah dari `v0.5.0`;
- consumer .NET harus memakai immutable workflow pin pada patch ini atau yang
  lebih baru, bukan implementation pin dari `v0.5.0`.

## [0.5.0] - 2026-08-30

### Ditambahkan

- typed caller contract untuk profile `.NET Web API` dengan SDK canonical tepat
  `10.0.110`, target `net10.0`, dan runtime `linux-x64`;
- locked restore, format verification, Release build, unit/integration test,
  machine-readable coverage, serta pemeriksaan package vulnerable dan deprecated;
- deterministic framework-dependent application package beserta manifest,
  SHA-256 digest, normalized metadata, dan status `ci-qualified`;
- opt-in .NET 11 preview lane `11.0.100-preview.6.26359.118` yang non-blocking
  dan tidak menghasilkan artifact;
- landing page profile, thin caller, troubleshooting, dan katalog onboarding.

### Keamanan dan batas

- caller dan reusable workflow hanya memakai `contents: read`, tanpa secret,
  OIDC, privileged environment, atau deployment;
- contract menolak arbitrary command, MSBuild property bebas, NuGet source,
  test filter, cache key, absolute path, traversal, dan extension di luar allowlist;
- canonical lane mengunggah tepat satu artifact; preview mengunggah nol artifact;
- .NET Worker, .NET 8 legacy, self-contained, Windows, arm64, OCI, dan deployment
  belum termasuk dalam rilis ini.

### Status adopsi

- profile tetap `In progress/pilot/not-validated` sampai `example-app-dotnet`,
  actual pilot evidence, dan release example tersedia;
- perubahan ini tidak mengubah perilaku executable PHP/Laravel atau Go.

## [0.4.1] - 2026-08-30

### Dokumentasi dan katalog

- menandai Go Service sebagai `Available` setelah workflow, example, test,
  actual pilot evidence, dan release tersedia;
- menautkan `OXY7O/example-app-go@v0.1.0` dari portal dan landing page profile;
- mengganti referensi workflow pra-merge dengan immutable release SHA
  `010dee6edcdf21f813e842ef3f193f4a2c83593e`;
- memperbarui thin caller guide ke pin yang sama.

### Batas

- tidak ada perubahan executable workflow atau artifact contract dari `v0.4.0`;
- lifecycle tetap `pilot`, compatibility tetap `not-validated`, dan deployment
  tetap tidak tersedia;
- `Available` bukan klaim supported atau operationally compliant.

## [0.4.0] - 2026-08-30

### Ditambahkan

- typed caller contract dan digest immutable untuk profile Go Service;
- family checks untuk module integrity, format, vet, unit test, race test,
  coverage, dan vulnerability melalui `govulncheck`;
- canonical Go 1.26.7 workflow yang membangun tepat satu deterministic Linux
  amd64 binary artifact beserta manifest dan SHA-256 digest;
- blocking Go 1.27.0 compatibility lane yang read-only dan tidak menghasilkan
  artifact;
- landing page Go Service, compatibility catalogue, dan panduan thin caller.

### Keamanan dan batas

- workflow menolak arbitrary command, absolute path, path traversal, symbolic
  link escape, target runtime yang tidak didukung, dan input di luar allowlist;
- caller dan reusable workflow hanya memakai `contents: read`, tanpa secret,
  OIDC, environment, atau deployment;
- OCI image, Linux arm64, Go CLI, promotion, release production, dan deployment
  tetap di luar scope;
- artifact berstatus `ci-qualified`, bukan izin release atau deployment.

### Cara mengadopsi

- profile Go Service masih `In progress`: reusable workflow tersedia sebagai
  kandidat pilot, sedangkan example dan evidence onboarding belum tersedia;
- pelajari landing page Go Service dan siapkan thin caller yang dipin ke full
  commit SHA rilis ini;
- tunggu `example-app-go` dan evidence pilot sebelum onboarding umum;
- profile PHP/Laravel dan kontraknya tidak berubah.

## [0.3.0] - 2026-08-29

### Ditambahkan

- landing page lintas technology stack yang memisahkan profile tersedia dan
  profile yang masih planned;
- katalog machine-readable untuk PHP/Laravel, Go, .NET, Python/Django,
  TypeScript/Node.js, serta Java/Spring Boot;
- landing page profile PHP/Laravel, panduan thin caller, troubleshooting, dan
  tautan menuju repository contoh canonical.

### Diubah

- README repository menjadi portal onboarding umum, bukan halaman khusus PHP;
- terminology implementasi dinormalisasi dari `demo` menjadi `example`;
- governance baseline dokumentasi diperbarui ke `platform-governance@v1.2.0`.

### Dampak bagi pengguna

- developer dapat memulai dari katalog umum, masuk ke detail profile, lalu
  membuka contoh implementasi tanpa menebak lokasi dokumen;
- label `Available` hanya menyatakan implementasi tersedia dan bukan klaim
  support, compatibility, atau operational compliance;
- profile planned tidak memiliki tautan workflow yang dapat dieksekusi.

### Batas perubahan

- reusable workflow, compatibility matrix, artifact contract, dan deployment
  behavior tidak berubah dari `v0.2.1`;
- deployment tetap di luar scope rilis ini.

## [0.2.1] - 2026-08-29

### Dokumentasi

- Menyusun ulang README berdasarkan perjalanan pengguna: memahami fungsi repository, memilih workflow, mengadopsi thin caller, membaca output, lalu menangani kegagalan.
- Menambahkan badge untuk Versi release, Status CI, Profil PHP/Laravel, lifecycle pilot, dan batas Tanpa deployment.
- Menambahkan tabel dukungan Laravel/PHP, pembagian canonical dan compatibility lane, serta batas preview dan legacy/EOL.

### Dampak bagi pengguna

- Pengguna baru dapat menemukan langkah adopsi dan batasan utama dari satu halaman.
- Platform team dan reviewer memperoleh rujukan ringkas mengenai ownership, output, serta jalur troubleshooting.
- Tidak ada perubahan kontrak, reusable workflow, compatibility matrix, artifact, atau perilaku keamanan dari `v0.2.0`.

### Cara mengadopsi

- Consumer yang sudah dipin ke commit `v0.2.0` tidak perlu mengubah workflow.
- Gunakan dokumentasi `v0.2.1` sebagai panduan terbaru; untuk eksekusi, tetap pin reusable workflow ke full commit SHA yang sudah disetujui.

## [0.2.0] - 2026-08-29

### Added

- Kontrak compatibility PHP/Laravel bertipe ketat dan digest canonical.
- Generator matrix deterministik untuk enam lane wajib serta preview opt-in non-blocking.
- Reusable workflow compatibility-only yang read-only, secretless, dan tidak menghasilkan artifact.

### Security

- Menolak arbitrary command, path traversal, identitas lane yang kontradiktif, lane wajib yang hilang, dan preview blocking.

## [0.1.2] - 2026-08-29

### Fixed

- Memisahkan file source yang wajib menggagalkan packaging dari file non-runtime yang harus dikecualikan.
- Mengecualikan `.env.example`, test source, Git metadata, `node_modules`, dan coverage output dari application package.
- Tetap menggagalkan build ketika `.env` aktual, key file, private-key material, atau symbolic link ditemukan.

## [0.1.1] - 2026-08-29

### Fixed

- Menghapus checkout manual lintas private repository yang memakai SHA caller secara keliru.
- Menjalankan implementasi internal melalui private actions yang dipin ke full commit SHA.
- Menjaga workflow tetap read-only, secretless, dan kompatibel dengan caller private repository.

## [0.1.0] - 2026-08-28

### Added

- Fondasi reusable workflow untuk keluarga PHP dan profil Laravel.
- Kontrak caller, output, taxonomy kegagalan, manifest, dan handoff artifact.
- Application package deterministik dengan digest dan safe evidence metadata.
- Contoh thin caller yang dipin ke commit immutable.
- Validasi mandiri repository dan dokumentasi operasional pilot.
