# Changelog

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
