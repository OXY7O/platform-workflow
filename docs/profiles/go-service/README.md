# Profile Go Service

![Profile](https://img.shields.io/badge/profile-go--service-00add8)
![Lifecycle](https://img.shields.io/badge/lifecycle-pilot-f59e0b)
![Availability](https://img.shields.io/badge/availability-available-1a7f37)
![Tanpa deployment](https://img.shields.io/badge/deployment-tidak%20tersedia-6b7280)

Landing page reusable CI untuk service atau API berbasis Go. Workflow dan
`example-app-go@v0.1.0` tersedia untuk pembelajaran serta pilot onboarding.

## Status profile

| Atribut | Nilai |
|---|---|
| Profile key | `go-service` |
| Family | `go` |
| Availability | `Available` |
| Workflow | `platform-workflow@v0.4.0` |
| Example | `OXY7O/example-app-go@v0.1.0` |
| Governance lifecycle | `pilot` |
| Compatibility state | `not-validated` |
| Governance baseline | `platform-governance@v1.2.0` |
| Deployment | Tidak tersedia |

`Available` menyatakan reusable workflow dan example dapat digunakan untuk
pilot. Status ini bukan klaim `supported`, compatibility `verified`, atau
`operationally compliant`.

## Use case dan batas

Profile ditujukan untuk HTTP service atau API Go yang menghasilkan satu binary
Linux amd64. Implementasi awal menggunakan standard library atau dependency Go
yang dikunci melalui `go.mod` dan `go.sum`.

Container image, multi-architecture binary, deployment, release production,
arbitrary command, dan secret forwarding tidak termasuk dalam baseline ini.

## Runtime dan compatibility

| Lane | Versi | Fungsi | Blocking | Artifact |
|---|---|---|---|---|
| Canonical | Go 1.26.7 | Validasi utama dan packaging | Ya | Satu binary package |
| Compatibility | Go 1.27.0 | Validasi kompatibilitas runtime berikutnya | Ya | Tidak |

Canonical runtime sengaja dikunci ke versi tepat. Go 1.27.0 dijalankan sebagai
compatibility-only lane agar perubahan toolchain terlihat tanpa menghasilkan
artifact kedua. Compatibility matrix berasal dari catalogue terkelola dan tidak
dapat diganti bebas oleh repository consumer.

## Required checks

Family dan profile workflow menjalankan pemeriksaan berikut:

1. validasi kontrak input dan working directory;
2. verifikasi versi toolchain Go yang tepat;
3. `go mod verify` dan pemeriksaan agar dependency graph tetap frozen;
4. format source, static analysis, unit test, race test, dan coverage threshold;
5. vulnerability check menggunakan `govulncheck`;
6. validasi main package dan deterministic binary build;
7. manifest, digest, dan Safe evidence metadata.

Kegagalan dipetakan ke Failure taxonomy terkontrol supaya developer dapat
membedakan contract, dependency, quality, test, security, build, dan platform
failure tanpa mengekspos secret.

## Kontrak input

Thin caller mengirim satu `contract-json` yang tervalidasi. Field utama meliputi:

- governance dan catalogue version;
- profile key `go-service`;
- Go version `1.26.7` untuk canonical lane;
- working directory relatif;
- main package relatif, misalnya `./cmd/api`;
- binary name yang aman;
- coverage threshold 0–100;
- artifact retention 1–30 hari;
- extension yang berasal dari allowlist.

Caller tidak boleh mengirim absolute path, path traversal, arbitrary shell
command, environment, credential, atau `secrets: inherit`. Lihat [Thin caller](THIN-CALLER.md)
untuk bentuk input dan pemanggilan yang benar.

## Output dan Binary artifact

Canonical lane membangun satu binary Linux amd64 dengan `CGO_ENABLED=0`,
`-trimpath`, dan build metadata yang dikendalikan. Hasilnya dikemas sebagai satu
arsip `.tar.gz` deterministik yang berisi binary dan manifest JSON.

Manifest merekam artifact ID/name, source SHA, workflow SHA, runtime, target OS
dan architecture, binary digest, archive digest, serta contract digest. Output
workflow mencakup readiness, failure category, normalized checks, artifact
metadata, dan status `ci-qualified`.

`ci-qualified` hanya berarti artifact lolos kontrak CI. Nilai ini tidak memberi
izin promotion, release, atau deployment. Compatibility lane tidak membangun
atau mengunggah artifact.

## Safe evidence metadata

Evidence aman dapat memuat source SHA, workflow SHA, runner class, contract dan
lock digest, hasil check, artifact digest, serta evidence reference. Secret,
token, SSH key, environment value, dan data sensitif tidak boleh dicatat.

Lihat [handoff artifact](../../ARTIFACT-HANDOFF.md) dan
[Failure taxonomy](../../FAILURE-TAXONOMY.md).

## Onboarding checklist

- [ ] Pastikan workload sesuai dengan profile `go-service`.
- [ ] Commit `go.mod` dan `go.sum` yang konsisten.
- [ ] Sediakan main package pada path relatif yang jelas.
- [ ] Jalankan format, vet, unit, race, coverage, dan vulnerability check lokal.
- [ ] Baca [Thin caller](THIN-CALLER.md) dan siapkan kontrak terkontrol.
- [ ] Pin reusable workflow ke full commit SHA yang disetujui.
- [ ] Jangan mengirim secret atau menambahkan deployment pada caller CI.
- [ ] Pelajari `example-app-go@v0.1.0` dan actual pilot evidence sebelum adopsi.
- [ ] Verifikasi canonical lane menghasilkan tepat satu artifact.
- [ ] Konfirmasi compatibility lane tidak menghasilkan artifact.
- [ ] Catat bahwa `ci-qualified` bukan izin deployment.

## Troubleshooting

1. Buka failed check dan identifikasi Failure taxonomy.
2. Periksa exact Go version, `go.mod`, `go.sum`, dan working directory.
3. Jalankan kembali format, vet, unit, race, coverage, dan vulnerability check.
4. Pastikan main package dapat membangun binary Linux amd64 tanpa CGO.
5. Jangan mengendurkan required check atau mengubah compatibility lane.
6. Gunakan [panduan troubleshooting umum](../../TROUBLESHOOTING.md).
7. Untuk platform failure, kirim run URL dan Safe evidence metadata kepada
   Platform Workflow tanpa menyalin secret.

## Tautan teknis

- [Thin caller](THIN-CALLER.md)
- [Handoff artifact](../../ARTIFACT-HANDOFF.md)
- [Failure taxonomy](../../FAILURE-TAXONOMY.md)
- [Example App Go](https://github.com/OXY7O/example-app-go)
- [Kembali ke katalog](../README.md)

Repository `example-app-go@v0.1.0` membuktikan canonical Go 1.26.7 artifact dan
artifactless Go 1.27.0 compatibility lane. Example tetap bukan production
starter atau izin deployment.
