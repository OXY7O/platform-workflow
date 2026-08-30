# Thin caller .NET Web API

Thin caller menyambungkan repository aplikasi ke reusable workflow pusat tanpa menyalin logika CI. Referensi di bawah dipin ke commit implementasi workflow yang immutable.

```yaml
name: CI .NET Web API

on:
  pull_request:
  push:
    branches: [development, staging, main]

permissions:
  contents: read

jobs:
  ci:
    uses: OXY7O/platform-workflow/.github/workflows/ci-profile-dotnet-webapi.yml@5bcb4f8110597667919ff4d65a89660f06e69b6f
    with:
      contract-json: >-
        {"schemaVersion":"1.0","governanceVersion":"v1.3.0","catalogueVersion":"1.3.0","profileKey":"dotnet-webapi","sdkVersion":"10.0.110","targetFramework":"net10.0","solutionPath":"Example.App.Dotnet.slnx","projectPath":"src/Example.Api/Example.Api.csproj","testProjectPath":"tests/Example.Api.Tests/Example.Api.Tests.csproj","artifactName":"example-api","applicationVersion":"0.1.0","runtimeIdentifier":"linux-x64","publishMode":"framework-dependent","coverageThreshold":80,"retentionDays":14,"evidenceMode":"safe-metadata","extensions":[]}
      compatibility-catalogue-path: compatibility/dotnet-webapi.json
      include-preview: true
```

## Aturan caller

- Gunakan `permissions: contents: read`.
- Pin workflow ke full commit SHA, bukan branch atau moving tag.
- Jangan memakai `secrets: inherit`.
- Gunakan path relatif tanpa `..` atau symlink escape.
- Jangan menambahkan command, MSBuild property bebas, NuGet source, filter, atau cache key.
- Preview bersifat opsional, non-blocking, dan artifactless.
- `ci-qualified` bukan izin deployment.

## Parameter penting

| Parameter | Nilai awal | Keterangan |
|---|---|---|
| `sdkVersion` | `10.0.110` | Canonical SDK tepat |
| `targetFramework` | `net10.0` | Target canonical |
| `solutionPath` | `Example.App.Dotnet.slnx` | Solution relatif |
| `projectPath` | `src/Example.Api/Example.Api.csproj` | Web SDK project |
| `testProjectPath` | `tests/Example.Api.Tests/Example.Api.Tests.csproj` | Test project relatif |
| `runtimeIdentifier` | `linux-x64` | Target publish awal |
| `publishMode` | `framework-dependent` | Runtime tidak dibundel |
| `coverageThreshold` | `80` | Ambang 0–100 |
| `retentionDays` | `14` | Retensi 1–30 hari |

Kembali ke [landing page .NET Web API](README.md).
