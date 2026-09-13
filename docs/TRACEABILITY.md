# Traceability capability deployment

Status `implemented` berarti kontrol tersedia dalam kode. Status `pilot` berarti
masih memerlukan pengujian aktual dan evidence sebelum dinyatakan terverifikasi.

| Governance | Kebutuhan | Implementasi | Status |
|---|---|---|---|
| P04 | Promotion memakai source dan SHA yang dikendalikan | deployment contract mengikat `sourceSha` dan `workflowSha` | implemented |
| P06 | Workflow reusable dan caller immutable | dua reusable workflow dengan full-SHA pin | implemented |
| P07 | Artifact immutable, SBOM, provenance, dan LKG | OCI publication serta digest-based rollback | pilot |
| P08 | Environment dan deployment terkontrol | GitHub Environment `development` dan target catalogue | pilot |
| P09 | Runner dan network boundary | self-hosted `platform-ci`, strict known hosts, allowlisted wrapper | pilot |
| P10 | Secret scoped dan evidence aman | explicit environment secrets dan allowlist-only evidence | implemented |

Capability staging dan production belum diimplementasikan. Status di atas tidak
menggantikan assessment, approval, audit, atau remediation record pada
`platform-governance`.
