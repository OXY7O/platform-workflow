# Profile PHP/Laravel

![Profile](https://img.shields.io/badge/profile-php--laravel-777bb4)
![Lifecycle](https://img.shields.io/badge/lifecycle-pilot-f59e0b)
![Compatibility](https://img.shields.io/badge/compatibility-not--validated-6b7280)

Landing page implementasi reusable CI untuk aplikasi Laravel. Halaman ini
menghubungkan kontrak workflow, compatibility matrix, thin caller, artifact,
evidence, troubleshooting, dan contoh implementasi.

## Status profile

| Atribut | Nilai |
|---|---|
| Profile key | `php-laravel` |
| Family | `php` |
| Availability | `Available` |
| Governance lifecycle | `pilot` |
| Compatibility state | `not-validated` |
| Governance baseline | `platform-governance@v1.5.0` |
| Runtime logical ID | `php-ci/8.3` |
| Runtime release | [`platform-runtime-images@v0.1.1`](https://github.com/OXY7O/platform-runtime-images/releases/tag/v0.1.1) |
| Runtime image | `ghcr.io/oxy7o/platform-ci-php@sha256:e406cd0def2e69f3ca9800ab68ede80ad7f3a5fd7b23dc20b1927371d867db69` |
| OCI publication | Pilot; GitHub-hosted runner, GHCR, SBOM, provenance, immutable digest |
| Deployment | Pilot; container host development saja, belum terverifikasi aktual |

`Available` berarti reusable workflow dan example dapat dipakai untuk pilot.
Status ini bukan klaim `supported` atau `operationally compliant`. Template
repository, TCV, EVD formal, audit, dan remediation masih diperlukan sebelum
status governance dapat dinaikkan.

## Use case yang didukung

- Laravel web application;
- REST API;
- queue worker dan scheduler sebagai workload mode;
- application package untuk handoff setelah CI;
- pengujian canonical dan compatibility beberapa versi.

Lumen tidak menjadi profile terpisah. Project baru menggunakan Laravel; aplikasi
legacy dinilai melalui exception dan migration plan.

## Prasyarat repository aplikasi

- struktur aplikasi Laravel yang valid;
- `composer.json` dan `composer.lock` sudah dikomit;
- test profile `phpunit` atau `pest`;
- source tidak menyimpan `.env`, private key, credential, atau symbolic link
  yang dilarang;
- GitHub Actions caller memiliki permission `contents: read`;
- owner teknis dan work item onboarding sudah ditetapkan.

## Workflow yang tersedia

| Workflow | Kapan digunakan | Artifact |
|---|---|---|
| `ci-family-php.yml` | Kontrol dasar PHP dan Composer | Tidak |
| `ci-profile-php-laravel.yml` | Canonical CI Laravel | Tepat satu `application-package` |
| `ci-compatibility-php-laravel.yml` | Uji kombinasi Laravel/PHP tambahan | Tidak |
| `build-oci-php-laravel.yml` | Build dan publish OCI setelah CI qualified | OCI image |
| `deploy-container-host-development.yml` | Deploy digest ke container host development | Safe evidence |

OCI publication berjalan pada GitHub-hosted runner tanpa credential deployment
atau akses jaringan internal. Status `ci-qualified` dan artifact yang berhasil
diterbitkan tetap bukan authorization deployment; delivery internal diproses
melalui control plane private `platform-provisioning`.

Consumer mulai dari [thin caller](THIN-CALLER.md). Action internal tidak dipanggil
satu per satu oleh repository aplikasi.

Canonical family dan packaging job berjalan di runtime yang sama dan immutable.
Workflow tidak memasang PHP atau Composer secara native pada runner. Compatibility
lane tetap menggunakan runtime per versinya karena tujuannya menguji kombinasi
PHP/Laravel tambahan dan tidak menghasilkan artifact.

## Compatibility matrix

| Laravel | PHP | Execution mode | Lifecycle | Blocking | Artifact |
|---|---|---|---|---|---|
| 13 | 8.3 | canonical-artifact | active | Ya | Tepat satu |
| 13 | 8.4–8.5 | compatibility-only | active | Ya | Tidak |
| 12 | 8.2–8.5 | compatibility-only | security-only | Ya | Tidak |
| 13 | 8.6 | compatibility-only | preview | Tidak; opt-in | Tidak |
| 8 | 7.4 | exception-only | legacy/EOL | Tidak | Tidak |

Sumber runtime aktual tetap berada pada compatibility catalogue milik repository
consumer. Preview tidak boleh menjadi blocking gate. Legacy/EOL memerlukan owner,
justifikasi, expiry, compensating control, dan migration plan.

## Kontrak input

Canonical caller hanya dapat menetapkan:

- governance dan catalogue version;
- profile key;
- versi PHP;
- dependency mode `composer-frozen`;
- test profile `phpunit` atau `pest`;
- working directory relatif;
- coverage threshold 0–100;
- retention 1–30 hari;
- extension dari allowlist.

Caller tidak dapat mengirim arbitrary shell command, absolute path, path
traversal, environment, atau `secrets: inherit`.

Compatibility caller lebih sempit: lane identity, versi Laravel/PHP, working
directory, frozen dependency mode, test profile, lifecycle, eligibility, dan
blocking behavior. Compatibility caller tidak menerima packaging, retention,
secret, atau environment.

## Output dan artifact

Canonical lane mengembalikan:

- readiness dan failure category;
- contract digest serta lock digest;
- normalized checks;
- artifact ID, name, manifest, dan SHA-256 digest;
- status `ci-qualified`;
- Safe evidence metadata.

`ci-qualified` hanya menyatakan artifact lolos kontrak CI. Nilai tersebut tidak
memberi izin promotion, release, atau deployment.

Compatibility lane hanya mengembalikan readiness, failure category, digest, dan
Safe evidence metadata. Lane ini tidak membangun atau mengunggah artifact.

## Safe evidence metadata

Evidence aman dapat mencatat source SHA, workflow SHA, runner class/image,
contract digest, lock digest, hasil check, artifact digest, dan evidence
reference. Secret, credential, private key, environment value, dan data sensitif
tidak boleh dicatat.

Lihat [handoff artifact](../../ARTIFACT-HANDOFF.md) dan
[failure taxonomy](../../FAILURE-TAXONOMY.md).

## Contoh implementasi

[OXY7O/example-app-laravel](https://github.com/OXY7O/example-app-laravel)
menunjukkan:

- thin caller yang dipin ke immutable SHA;
- canonical Laravel 13/PHP 8.3;
- compatibility Laravel 12 dan Laravel 13;
- test lokal berbasis container;
- tepat satu canonical artifact;
- traceability dan evidence pilot.

Example adalah materi pembelajaran dan validasi, bukan starter production.

## Onboarding checklist

- [ ] Pastikan workload sesuai dengan profile `php-laravel`.
- [ ] Pilih kombinasi Laravel/PHP yang masih diizinkan.
- [ ] Commit `composer.json` dan `composer.lock`.
- [ ] Salin [contoh thin caller](../../../examples/thin-caller-php-laravel.yml).
- [ ] Tetapkan input terkontrol, coverage threshold, dan retention.
- [ ] Pin reusable workflow ke full commit SHA yang disetujui.
- [ ] Jalankan Composer dan test secara lokal.
- [ ] Buka pull request dan tunggu seluruh required check.
- [ ] Verifikasi hanya canonical lane menghasilkan artifact dan digest.
- [ ] Catat safe evidence reference serta owner onboarding.
- [ ] Konfirmasi bahwa `ci-qualified` bukan izin deployment.

## Troubleshooting

1. Buka failed check dan baca failure category.
2. Periksa kontrak input, versi runtime, lock file, test, dan coverage.
3. Pastikan source tidak memuat file terlarang.
4. Jangan menonaktifkan required gate atau mengubah preview menjadi blocking.
5. Gunakan [panduan troubleshooting umum](../../TROUBLESHOOTING.md).
6. Untuk platform failure, eskalasikan run URL dan safe metadata kepada Platform
   Workflow—tanpa menyalin secret.

## Tautan teknis

- [Thin caller dan parameter](THIN-CALLER.md)
- [Contoh caller YAML](../../../examples/thin-caller-php-laravel.yml)
- [Handoff artifact](../../ARTIFACT-HANDOFF.md)
- [Failure taxonomy](../../FAILURE-TAXONOMY.md)
- [Example App Laravel](https://github.com/OXY7O/example-app-laravel)
- [Kembali ke katalog](../README.md)
- [Panduan container-host development](../../deployment/container-host-development.md)
- [Traceability governance](../../TRACEABILITY.md)
