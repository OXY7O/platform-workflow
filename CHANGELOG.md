# Changelog

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
