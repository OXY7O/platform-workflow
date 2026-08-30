# Thin caller Go Service

Thin caller menyambungkan repository aplikasi ke reusable workflow pusat tanpa
menyalin implementasi CI. Contoh ini adalah acuan persiapan; `go-service` masih
`In progress` sampai example dan evidence pilot tersedia.

```yaml
name: CI Go Service

on:
  pull_request:
  push:
    branches: [development, staging, main]

permissions:
  contents: read

jobs:
  ci:
    uses: OXY7O/platform-workflow/.github/workflows/ci-profile-go-service.yml@01ba3658baea484247b65f54c1a8d672fa231a79
    with:
      contract-json: >-
        {"governanceVersion":"v1.2.0","catalogueVersion":"1.2.0","profileKey":"go-service","goVersion":"1.26.7","workingDirectory":".","mainPackage":"./cmd/api","binaryName":"service-api","coverageThreshold":80,"retentionDays":7,"extensions":[]}
```

## Aturan caller

- Gunakan `permissions: contents: read`.
- Pin reusable workflow ke full commit SHA yang disetujui.
- Jangan memakai branch atau moving tag sebagai pin operasional.
- Jangan menambahkan `secrets: inherit`.
- Gunakan path relatif tanpa `..` dan tanpa symbolic-link escape.
- Jangan menyisipkan command, deployment, atau credential ke contract JSON.
- Ubah input hanya dalam batas schema dan catalogue yang berlaku.

## Parameter penting

| Parameter | Contoh | Keterangan |
|---|---|---|
| `governanceVersion` | `v1.2.0` | Baseline governance yang dirujuk |
| `catalogueVersion` | `1.2.0` | Versi katalog implementasi |
| `profileKey` | `go-service` | Harus tepat |
| `goVersion` | `1.26.7` | Canonical runtime |
| `workingDirectory` | `.` | Root module relatif |
| `mainPackage` | `./cmd/api` | Package pembentuk binary |
| `binaryName` | `service-api` | Nama binary aman |
| `coverageThreshold` | `80` | Ambang 0–100 |
| `retentionDays` | `7` | Retensi artifact 1–30 hari |
| `extensions` | `[]` | Hanya nilai allowlist |

Kembali ke [landing page Go Service](README.md).
