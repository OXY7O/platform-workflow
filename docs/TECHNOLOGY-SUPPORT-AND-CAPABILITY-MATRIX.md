# Technology Support and Capability Matrix

Dokumen ini adalah panduan keputusan developer dan platform operator. Sumber data
machine-readable berada di
[`catalogue/technology-capabilities.json`](../catalogue/technology-capabilities.json).

## Status

- **Available**: workflow tersedia untuk dipelajari dan digunakan sebagai pilot.
- **Pilot verified**: combination pernah lulus pengujian pilot.
- **Supported**: dukungan operasional telah disetujui; belum ada pada scope ini.
- **Canonical**: combination utama yang menghasilkan artifact.
- **Compatibility**: combination tambahan, artifactless.
- **Maintenance**: dipertahankan terbatas dan bukan default project baru.
- **Legacy**: exception-only dengan migration plan.
- **Planned**: capability belum dapat dipilih.

Available dan Pilot verified tidak berarti operationally compliant.

## PHP Laravel

| Combination | Channel | Mode | Project baru | Verification |
|---|---|---|---|---|
| Laravel 13 / PHP 8.3 | Canonical | canonical artifact | Ya, untuk pilot yang disetujui | pilot-verified |
| Laravel 13 / PHP 8.4–8.5 | Compatibility | compatibility-only | Tidak sebagai canonical | pilot-verified |
| Laravel 12 / PHP 8.2–8.5 | Maintenance | compatibility-only | Tidak | pilot-verified |
| Laravel 13 / PHP 8.6 | Preview | non-blocking compatibility | Tidak | pilot-verified |
| Laravel 8 / PHP 7.4 | Legacy | exception-only | Tidak | not-verified |

Versi di tabel adalah combination yang tercatat pada catalogue saat ini, bukan
pernyataan umum bahwa seluruh versi framework/runtime didukung organisasi.

## Capability Laravel CI

| Category | Capability | Status |
|---|---|---|
| CI | Typed contract, syntax, frozen dependency, unit test | Implemented |
| Security minimum | Sensitive material guard, Composer dependency audit | Implemented |
| Artifact | Deterministic application package dan digest | Implemented |
| Evidence | Normalized checks dan Safe metadata | Implemented |
| CI | Coverage report enforcement | Implementation gap |
| Runner | Approved self-hosted/GitHub-hosted routing | Governance gap |
| Security | SAST, full secret scanning, SBOM, signing | Planned |
| Deployment | VM container dan Kubernetes | Planned |

Extension yang belum mempunyai executor tidak selectable. Developer tidak boleh
menambahkan arbitrary action untuk menggantikan capability Planned.

## Flow pemilihan

```text
Kebutuhan aplikasi
  → pilih family PHP
  → pilih profile php-laravel
  → pilih exact combination yang eligible
  → periksa capability dan gap
  → periksa Governance Traceability Matrix
  → periksa certification example-app-laravel
  → bentuk approved bundle
  → platform-provisioning atau sandbox
```

Jika exact combination belum tersertifikasi, provisioning menggunakan sandbox.
Jika capability berstatus governance-gap atau conflict, operator menghentikan
rollout sampai keputusan governance tersedia.
