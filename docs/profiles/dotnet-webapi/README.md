# Profile .NET Web API

![Profile](https://img.shields.io/badge/profile-dotnet--webapi-512bd4)
![Lifecycle](https://img.shields.io/badge/lifecycle-pilot-f59e0b)
![Availability](https://img.shields.io/badge/availability-in%20progress-d97706)
![Tanpa deployment](https://img.shields.io/badge/deployment-tidak%20tersedia-6b7280)

Landing page reusable CI untuk HTTP API berbasis ASP.NET Core controllers. Workflow sudah menjadi kandidat pilot, tetapi `example-app-dotnet` dan actual pilot evidence belum tersedia. Karena itu statusnya masih **In progress**, bukan baseline `Available`.

## Status profile

| Atribut | Nilai |
|---|---|
| Profile key | `dotnet-webapi` |
| Family | `.NET` |
| Availability | `In progress` |
| Governance lifecycle | `pilot` |
| Compatibility | `not-validated` |
| Canonical SDK | `.NET SDK 10.0.110` |
| Target | `net10.0` / `linux-x64` |
| Package | framework-dependent application package |
| Example | Belum tersedia |
| Governance baseline | `platform-governance@v1.3.0` |
| Deployment | Tidak tersedia |

Status ini hanya menyatakan implementasi workflow sedang dipilotkan. Ini bukan klaim `supported`, compatibility `verified`, atau `operationally compliant`.

## Use case dan batas

Profile ditujukan untuk ASP.NET Core Web API berbasis controller yang dapat dipublish sebagai aplikasi framework-dependent Linux x64. .NET Worker, self-contained publish, Windows, arm64, OCI image, database, authentication, cloud integration, release production, dan deployment berada di luar baseline awal.

## Runtime dan compatibility matrix

| Lane | SDK | Target | Blocking | Artifact |
|---|---|---|---|---|
| Canonical | .NET SDK 10.0.110 | `net10.0` / `linux-x64` | Ya | Satu application package |
| Preview opt-in | `11.0.100-preview.6.26359.118` | `net10.0` / `linux-x64` | Tidak | Tidak |

Canonical memakai versi SDK tepat agar build dapat direproduksi. Preview hanya dijalankan bila caller memilih `include-preview: true`; kegagalannya tidak menggagalkan readiness canonical dan tidak menghasilkan artifact. .NET 8 legacy akan ditambahkan melalui lifecycle review tersendiri.

## Required checks

1. Validasi kontrak typed dan seluruh path relatif.
2. Verifikasi exact SDK.
3. Locked restore berdasarkan `packages.lock.json`.
4. Pemeriksaan format tanpa mengubah source.
5. Release build tanpa restore ulang.
6. Unit/integration test dan machine-readable coverage minimal 80%.
7. Pemeriksaan package vulnerable dan deprecated dalam JSON.
8. Validasi `Microsoft.NET.Sdk.Web`, `net10.0`, dan framework-dependent publish.
9. Paket deterministik, manifest, digest, dan Safe evidence metadata.

Kegagalan dinormalisasi menggunakan [Failure taxonomy](../../FAILURE-TAXONOMY.md): contract, dependency, configuration, quality, test, security, artifact, atau platform.

## Kontrak input

Thin caller mengirim satu `contract-json` dengan identitas governance, exact SDK, solution/project/test path, artifact name, application version, target, coverage, retensi, dan evidence mode. Caller tidak dapat mengirim command, MSBuild property bebas, NuGet source, test filter, cache key, absolute path, path traversal, secret, atau extension di luar allowlist.

Lihat [Thin caller](THIN-CALLER.md) untuk contoh lengkap dan parameter yang diizinkan.

## Output dan application package

Canonical lane menghasilkan tepat satu arsip:

```text
<artifact-name>_<application-version>_net10.0_linux-x64.tar.gz
```

Arsip berisi output publish yang telah diverifikasi dan satu `manifest.json`. Path disortir; waktu, UID, GID, serta mode dinormalisasi; symlink, `.env`, private key, source/test/coverage, dan runtime self-contained ditolak. Output workflow mencakup readiness, failure category, artifact ID/name/digest, manifest digest, dan evidence metadata.

Status `ci-qualified` berarti paket lolos kontrak CI. Status tersebut bukan persetujuan release, promotion, atau deployment.

## Safe evidence metadata

Evidence aman dapat menyimpan source SHA, immutable workflow SHA, contract/dependency digest, runner class/image, normalized checks, artifact/manifest digest, retensi, dan evidence reference. Token, secret, private key, environment value, serta source sensitif tidak boleh masuk evidence.

## Onboarding checklist

- [ ] Pastikan workload adalah controller-based ASP.NET Core Web API.
- [ ] Gunakan `global.json` dengan SDK tepat `10.0.110`.
- [ ] Targetkan `net10.0` dan commit semua `packages.lock.json`.
- [ ] Jalankan restore terkunci, format check, Release build, test, coverage, dan dependency check lokal.
- [ ] Baca [Thin caller](THIN-CALLER.md) dan gunakan hanya field kontrak yang tersedia.
- [ ] Pin reusable workflow ke full commit SHA yang disetujui.
- [ ] Pertahankan `permissions: contents: read`; jangan teruskan secret.
- [ ] Gunakan preview hanya untuk observasi compatibility.
- [ ] Konfirmasi canonical menghasilkan satu package dan preview nol artifact.
- [ ] Tunggu `example-app-dotnet` serta actual pilot evidence sebelum mengubah status menjadi `Available`.

## Troubleshooting

1. Cocokkan kategori kegagalan dengan Failure taxonomy.
2. Periksa `global.json`, SDK aktual, target framework, dan runtime identifier.
3. Pastikan lock file tersedia pada project aplikasi dan project test.
4. Jalankan `dotnet format`, Release build, test/coverage, vulnerable, dan deprecated check lokal.
5. Pastikan output publish framework-dependent tidak membawa runtime pack atau source.
6. Jangan mengendurkan required check atau membuat preview menjadi blocking.
7. Untuk platform failure, kirim run URL dan Safe evidence metadata tanpa menyalin secret.

## Tautan teknis

- [Thin caller](THIN-CALLER.md)
- [Handoff artifact](../../ARTIFACT-HANDOFF.md)
- [Failure taxonomy](../../FAILURE-TAXONOMY.md)
- [Kembali ke katalog](../README.md)

`example-app-dotnet` akan menjadi bukti consumer pada tahap berikutnya. Sampai repository dan evidence tersebut dirilis, profile ini tetap `In progress`.
