# Changelog

Dokumen ini menjelaskan perubahan yang berdampak pada pengguna `platform-workflow`. Istilah teknis dipertahankan ketika merupakan bagian dari kontrak platform.

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
