# OXY7O Platform Workflow

[![Versi release](https://img.shields.io/badge/release-v0.2.1-0969da?label=Versi%20release)](https://github.com/OXY7O/platform-workflow/releases/tag/v0.2.1)
[![Status CI](https://github.com/OXY7O/platform-workflow/actions/workflows/validate-platform-workflow.yml/badge.svg)](https://github.com/OXY7O/platform-workflow/actions/workflows/validate-platform-workflow.yml)
![Profil PHP/Laravel](https://img.shields.io/badge/profil-PHP%20%2F%20Laravel-777bb4?label=Profil%20PHP%2FLaravel)
![Lifecycle pilot](https://img.shields.io/badge/lifecycle-pilot-f59e0b?label=Lifecycle)
![Tanpa deployment](https://img.shields.io/badge/deployment-tidak%20tersedia-6b7280?label=Tanpa%20deployment)

Reusable GitHub Actions untuk menjalankan CI PHP/Laravel secara konsisten berdasarkan `platform-governance@v1.1.0`. Release `v0.2.1` mempertahankan kontrak teknis `v0.2.0` dan menyempurnakan dokumentasinya agar lebih mudah diadopsi.

Repository ini memvalidasi kontrak, menguji aplikasi, menghasilkan tepat satu `application-package` dari canonical lane, dan memeriksa kompatibilitas beberapa versi PHP/Laravel tanpa membuat artifact tambahan. Repository ini **tidak melakukan deployment**.

## Siapa yang menggunakan repository ini?

- **Developer aplikasi** memakai thin caller untuk mengaktifkan CI standar tanpa menyalin seluruh implementasi.
- **Project lead** memilih profil, versi, coverage threshold, dan retention yang sudah diizinkan.
- **Platform team** memelihara kontrak, reusable workflow, taxonomy kegagalan, dan proses packaging.
- **Auditor atau reviewer** memakai safe evidence metadata dan digest untuk menelusuri hasil CI.

## Alur kerja dalam satu tampilan

```text
Pull request aplikasi
        |
        +--> canonical lane --> lint/test/security/quality --> 1 application-package
        |
        +--> compatibility matrix --> test setiap versi --> metadata saja
                                                        (tanpa artifact)
```

Artifact yang lolos CI baru berstatus `ci-qualified`. Status tersebut **bukan** persetujuan promotion atau deployment.

## Pilih workflow yang tepat

| Kebutuhan | Workflow | Hasil |
|---|---|---|
| Kontrol umum keluarga PHP | `ci-family-php.yml` | Pemeriksaan baseline PHP |
| CI utama Laravel | `ci-profile-php-laravel.yml` | Pemeriksaan lengkap dan satu `application-package` |
| Uji banyak versi | `ci-compatibility-php-laravel.yml` | Readiness dan safe evidence metadata tanpa artifact |

Untuk repository aplikasi, mulai dari [contoh thin caller](examples/thin-caller-php-laravel.yml), bukan dengan memanggil action internal satu per satu.

## Mulai cepat

1. Salin `examples/thin-caller-php-laravel.yml` ke repository aplikasi sebagai `.github/workflows/ci.yml`.
2. Sesuaikan input terkontrol: versi PHP, test profile, working directory, coverage threshold, retention, dan extension dari allowlist.
3. Ganti referensi reusable workflow dengan **full commit SHA** release yang sudah divalidasi. Jangan memakai branch bergerak seperti `main`.
4. Pastikan `composer.lock` sudah dikomit dan sesuai dengan versi PHP/Laravel yang dipilih.
5. Buka pull request dan pastikan seluruh required check lulus.

Workflow pilot tidak membutuhkan secret aplikasi. Jangan menambahkan `secrets: inherit`.

Panduan parameter dan dua jalur caller tersedia di [Thin Caller PHP Laravel](docs/THIN-CALLER-PHP-LARAVEL.md).

## Dukungan versi PHP dan Laravel

| Laravel | PHP | Mode | Lifecycle | Blocking | Menghasilkan artifact |
|---|---|---|---|---|---|
| 13 | 8.3 | canonical | active | Ya | Ya, tepat satu |
| 13 | 8.4–8.5 | compatibility-only | active | Ya | Tidak |
| 12 | 8.2–8.5 | compatibility-only | security-only | Ya | Tidak |
| 13 | 8.6 | compatibility-only | preview | Tidak; opt-in | Tidak |
| 8 | 7.4 | exception-only | legacy/EOL | Tidak | Tidak |

Preview tidak boleh menjadi blocking gate. Legacy/EOL hanya boleh digunakan melalui exception yang memiliki owner, alasan, masa berlaku, dan migration plan.

## Output yang diterima caller

- status readiness dan kategori kegagalan;
- digest kontrak dan `composer.lock`;
- safe evidence metadata untuk audit;
- manifest serta digest `application-package` dari canonical lane;
- penanda `ci-qualified` setelah seluruh gate wajib berhasil.

Nilai secret, environment file, private key, dan credential tidak boleh masuk ke output atau artifact.

## Batasan penting

- Belum mendukung deployment ke development, staging, atau production.
- Belum memberikan status `operationally compliant`; status itu memerlukan audit organisasi dan remediasi gap.
- Compatibility lane tidak boleh menghasilkan artifact atau menjalankan proses promotion.
- Caller tidak boleh mengirim arbitrary command, absolute path, path traversal, atau secret inheritance.
- Tag release membantu discovery, tetapi caller produksi tetap harus menggunakan full commit SHA.

## Jika pemeriksaan gagal

1. Buka failed check dan identifikasi kategori kegagalannya.
2. Periksa kontrak input, `composer.lock`, versi runtime, test, coverage, serta file terlarang.
3. Jangan mematikan gate untuk melewati kegagalan.
4. Gunakan [panduan pemecahan masalah](docs/TROUBLESHOOTING.md) dan [kategori kegagalan](docs/FAILURE-TAXONOMY.md).
5. Eskalasikan platform failure kepada platform team dengan run URL dan safe evidence metadata—tanpa menyalin secret.

## Peta repository

| Lokasi | Fungsi |
|---|---|
| `.github/workflows/` | Reusable workflow yang dipanggil consumer |
| `profiles/` | Baseline dan larangan profil teknologi |
| `contracts/` | Schema input/output, manifest, taxonomy, dan handoff artifact |
| `actions/` dan `dist/` | Action internal dan bundle yang telah dikomit |
| `scripts/` | Executor deterministik dan validasi repository |
| `examples/` | Thin caller minimal yang siap diadopsi |

## Dokumentasi lanjutan

- [Thin Caller PHP Laravel](docs/THIN-CALLER-PHP-LARAVEL.md)
- [Handoff artifact](docs/ARTIFACT-HANDOFF.md)
- [Kategori kegagalan](docs/FAILURE-TAXONOMY.md)
- [Pemecahan masalah](docs/TROUBLESHOOTING.md)
- [Riwayat perubahan](CHANGELOG.md)
- [Release v0.2.1](https://github.com/OXY7O/platform-workflow/releases/tag/v0.2.1)
