# Changelog

Dokumen ini menjelaskan perubahan yang berdampak pada pengguna `platform-workflow`. Istilah teknis dipertahankan ketika merupakan bagian dari kontrak platform.

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
