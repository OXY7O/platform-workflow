# OXY7O Platform Workflow

Implementasi teknis reusable GitHub Actions yang mengikuti `platform-governance@v1.1.0`.

Versi awal `v0.1.0` adalah pilot untuk profil `php-laravel`. Cakupannya adalah validasi kontrak, pemeriksaan CI, pembuatan `application-package`, manifest, digest, dan metadata evidence yang aman. Repository ini **tidak melakukan deployment** ke development, staging, atau production.

## Mulai menggunakan

1. Salin [contoh thin caller](examples/thin-caller-php-laravel.yml) ke repository aplikasi sebagai `.github/workflows/ci.yml`.
2. Sesuaikan input terkontrol seperti versi PHP, test profile, working directory, coverage, dan retention.
3. Pertahankan referensi reusable workflow berupa full commit SHA.
4. Jangan mewariskan seluruh secret. Workflow pilot ini tidak membutuhkan secret aplikasi.

Panduan lengkap tersedia di [Thin Caller PHP Laravel](docs/THIN-CALLER-PHP-LARAVEL.md).

## Struktur utama

- `.github/workflows/ci-family-php.yml`: kontrol umum keluarga PHP.
- `.github/workflows/ci-profile-php-laravel.yml`: pemeriksaan Laravel dan paket aplikasi.
- `profiles/`: baseline pemeriksaan dan larangan per profil.
- `contracts/`: schema input/output, manifest, taxonomy, dan handoff artifact.
- `actions/` dan `dist/`: action internal beserta bundle yang telah dikomit.
- `scripts/`: executor deterministik dan validasi repository.
- `examples/`: caller minimal yang siap diadopsi.

## Dokumen operasional

- [Handoff artifact](docs/ARTIFACT-HANDOFF.md)
- [Kategori kegagalan](docs/FAILURE-TAXONOMY.md)
- [Pemecahan masalah](docs/TROUBLESHOOTING.md)
- [Catatan pilot v0.1.0](docs/PR-PILOT-V0.1.0.md)
- [Riwayat perubahan](CHANGELOG.md)

Status `operationally compliant` hanya dapat diberikan setelah audit organisasi dan remediasi gap sesuai platform governance. Pilot ini belum merupakan klaim kepatuhan operasional.
