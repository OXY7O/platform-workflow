# OXY7O Platform Workflow

[![Versi kandidat](https://img.shields.io/badge/kandidat-v0.7.0-f59e0b?label=Versi)](CHANGELOG.md)
[![Status CI](https://github.com/OXY7O/platform-workflow/actions/workflows/validate-platform-workflow.yml/badge.svg)](https://github.com/OXY7O/platform-workflow/actions/workflows/validate-platform-workflow.yml)
[![Governance baseline](https://img.shields.io/badge/governance-v1.5.0-8250df?label=Governance%20baseline)](https://github.com/OXY7O/platform-governance/releases/tag/v1.5.0)
![Deployment pilot](https://img.shields.io/badge/deployment-development%20pilot-f59e0b?label=Deployment)

Pusat implementasi reusable GitHub Actions untuk berbagai tech stack. Repository ini menerjemahkan policy, lifecycle, control, dan evidence requirement dari `platform-governance` menjadi workflow yang dapat digunakan repository aplikasi melalui thin caller.

`platform-workflow` bukan aplikasi contoh dan bukan tempat menyimpan konfigurasi aplikasi. Developer memilih profile yang tersedia, membaca kontraknya, melihat contoh implementasi, lalu mengadopsi thin caller tanpa menduplikasi logika CI pusat.

## Posisi dalam platform

```text
platform-governance
  policy, lifecycle, rule, control, evidence requirement
        |
platform-workflow
  reusable workflow, contract, validator, artifact, safe evidence metadata
        |
example-app-<profile>
  permanent compatibility dan certification fixture
        |
certification record -----------+
                                |
template-app-<profile> --> platform-provisioning
                                |
                         repository aplikasi
                         thin caller dan konfigurasi yang diizinkan
```

## Siapa yang menggunakan repository ini?

| Pengguna | Mulai dari | Tujuan |
|---|---|---|
| Developer | [Katalog tech stack](#katalog-tech-stack) | Menemukan workflow dan contoh yang sesuai |
| Project lead | [Cara memilih profile](#cara-memilih-profile) | Memastikan stack, lifecycle, dan artifact tepat |
| Platform team | [Peta repository](#peta-repository) | Memelihara kontrak dan reusable implementation |
| Security atau auditor | [Batas kontrol](#batas-kontrol) | Menelusuri permission, evidence, dan klaim compliance |

## Cara kerja

1. Governance menetapkan apa yang wajib, boleh, dilarang, dan diaudit.
2. Platform workflow menerapkan kontrol tersebut dalam reusable workflow.
3. Repository aplikasi hanya memiliki thin caller dan input yang tervalidasi.
4. Canonical lane dapat menghasilkan artifact; compatibility lane hanya memvalidasi kombinasi versi.
5. Workflow mengembalikan normalized result dan safe evidence metadata.
6. Deployment development memakai kontrak, GitHub Environment, immutable digest, dan evidence terpisah; merge atau status `ci-qualified` bukan izin deployment.
7. `platform-provisioning` memilih capability hanya melalui approved bundle dan
   memasang thin caller yang dipin ke commit SHA immutable.

Canonical PHP/Laravel memakai runtime [`php-ci/8.3`](https://github.com/OXY7O/platform-runtime-images/blob/v0.1.1/catalogue/php-ci.json)
dari `platform-runtime-images@v0.1.1`. Workflow mengunci image langsung ke
`ghcr.io/oxy7o/platform-ci-php@sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69`;
tag release hanya untuk discovery dan bukan referensi eksekusi.

## Katalog tech stack

`Available` berarti implementasi workflow dan example sudah dapat dipelajari dan diuji. `In progress` berarti workflow sudah tersedia sebagai kandidat pilot, tetapi example atau onboarding belum lengkap. Kedua status ini **bukan** klaim bahwa profile sudah `supported` atau `operationally compliant`. Stack `Planned` belum memiliki link executable.

| Family | Profile | Status | Detail workflow | Contoh implementasi |
|---|---|---|---|---|
| PHP | PHP/Laravel | **Available** | [Buka profile PHP/Laravel](docs/profiles/php-laravel/README.md) | [OXY7O/example-app-laravel](https://github.com/OXY7O/example-app-laravel) |
| Go | Go Service | **Available** | [Buka profile Go Service](docs/profiles/go-service/README.md) | [OXY7O/example-app-go](https://github.com/OXY7O/example-app-go) |
| .NET | .NET Web API | **Available** | [Buka profile .NET Web API](docs/profiles/dotnet-webapi/README.md) | [OXY7O/example-app-dotnet](https://github.com/OXY7O/example-app-dotnet) |
| Python | Python/Django | **Planned** | Belum tersedia | Belum tersedia |
| TypeScript/Node.js | Node.js Service | **Planned** | Belum tersedia | Belum tersedia |
| Java | Java/Spring Boot | **Planned** | Belum tersedia | Belum tersedia |

Lihat [indeks profile](docs/profiles/README.md) untuk status dan batas setiap profile.

## Cara memilih profile

1. Cocokkan bahasa, framework, dan workload aplikasi dengan katalog.
2. Pilih profile `Available`; status ini tetap bukan klaim support atau compliance.
3. Baca lifecycle runtime dan compatibility matrix pada halaman profile.
4. Pastikan artifact type yang dihasilkan sesuai kebutuhan handoff berikutnya.
5. Periksa batas runner, security, secret, dan deployment.
6. Bila tidak ada profile yang sesuai, ajukan profile baru melalui governance; jangan membuat variasi workflow sendiri tanpa review.

## Alur onboarding

```text
Pilih profile Available
  -> baca kontrak dan compatibility
  -> buka example app
  -> jalankan validasi lokal
  -> ajukan governed repository request
  -> platform-provisioning merender template dan thin caller
  -> pin workflow ke full commit SHA
  -> buka pull request
  -> verifikasi required checks, artifact, dan evidence
```

Checklist teknis berada pada landing page masing-masing profile. Gunakan [onboarding PHP/Laravel](docs/profiles/php-laravel/README.md#onboarding-checklist), [onboarding Go Service](docs/profiles/go-service/README.md#onboarding-checklist), atau [onboarding .NET Web API](docs/profiles/dotnet-webapi/README.md#onboarding-checklist). Example .NET dan evidence pilot sudah tersedia; lifecycle tetap `pilot` dan compatibility tetap `not-validated`.

## Konsep yang berlaku untuk semua profile

- **Reusable workflow:** implementasi pusat yang memiliki kontrak input/output.
- **Thin caller:** workflow kecil pada repository aplikasi yang hanya memilih input yang diizinkan.
- **Immutable pin:** referensi reusable workflow harus memakai full commit SHA, bukan branch bergerak.
- **Canonical lane:** jalur utama yang dapat menghasilkan artifact.
- **Compatibility lane:** pemeriksaan versi tambahan tanpa artifact dan tanpa deployment.
- **Safe evidence metadata:** bukti yang dapat diaudit tanpa membawa secret atau data sensitif.

## Batas kontrol

- Deployment hanya tersedia sebagai pilot container-host untuk `development`; staging dan production belum tersedia.
- Caller tidak boleh mengirim arbitrary command, path traversal, absolute path, atau `secrets: inherit`.
- Secret aplikasi, credential, private key, dan environment file tidak boleh masuk artifact atau evidence.
- `Available` hanya menyatakan implementasi tersedia; governance support/compliance tetap mengikuti catalogue, TCV, EVD, audit, dan remediation.
- Tag release membantu discovery, tetapi consumer tetap mem-pin full commit SHA yang disetujui.
- Repository ini tidak menerima request, memilih security profile, merender
  template, membuat repository, atau mengelola approval provisioning.

## Peta repository

| Lokasi | Fungsi |
|---|---|
| `.github/workflows/` | Reusable workflow publik untuk consumer |
| `profiles/` | Baseline family dan profile |
| `catalogue/` | Snapshot machine-readable ketersediaan implementasi |
| `contracts/` | Schema input/output, manifest, taxonomy, dan handoff |
| `actions/` dan `dist/` | Action internal dan bundle immutable |
| `examples/` | Thin caller minimal |
| `docs/profiles/` | Landing page dan onboarding per profile |

## Dokumentasi umum

- [Indeks profile](docs/profiles/README.md)
- [Handoff artifact](docs/ARTIFACT-HANDOFF.md)
- [Kategori kegagalan](docs/FAILURE-TAXONOMY.md)
- [Pemecahan masalah umum](docs/TROUBLESHOOTING.md)
- [Integrasi dengan Platform Provisioning](docs/PROVISIONING-INTEGRATION.md)
- [Deployment container-host development](docs/deployment/container-host-development.md)
- [Traceability capability](docs/TRACEABILITY.md)
- [Riwayat perubahan](CHANGELOG.md)
