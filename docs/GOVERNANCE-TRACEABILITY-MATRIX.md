# Governance Traceability Matrix

Dokumen ini membantu operator menelusuri control governance ke implementasi
teknis. Sumber data machine-readable berada di
[`catalogue/governance-traceability.json`](../catalogue/governance-traceability.json).

## Cara membaca status

| Dimensi | Nilai utama | Makna |
|---|---|---|
| Implementation | `implemented` | Executor atau preventive control tersedia |
| Implementation | `implementation-gap` | Requirement ada, implementasi belum lengkap |
| Implementation | `governance-gap` | Implementasi aktual belum memenuhi control atau approval governance |
| Implementation | `planned` | Capability belum dapat dipilih |
| Verification | `local-verified` | Test repository lulus; belum dibuktikan example release |
| Verification | `pilot-verified` | Pernah dibuktikan example/pilot; belum menjadi compliance declaration |
| Verification | `not-verified` | Belum memiliki evidence valid |
| Compliance | `not-assessed` | Belum dinilai melalui assessment independen |

`implemented` dan `pilot-verified` tidak sama dengan compliant. Status compliance
hanya berasal dari assessment, remediation/EXC, dan independent validation.

## Ringkasan Laravel CI

| Capability | Control | Implementasi | Verifikasi | Compliance |
|---|---|---|---|---|
| Typed caller | P06-002/003/017/033 | implemented | pilot-verified | not-assessed |
| Minimum permission | P06-010, P10-008 | implemented | local-verified | not-assessed |
| Sensitive material guard | P06-011, P10-024, P16-SDC | implemented | local-verified | not-assessed |
| PHP syntax | P06-023/024 | implemented | local-verified | not-assessed |
| Frozen dependency | P06-019/020/022 | implemented | pilot-verified | not-assessed |
| Dependency audit | P06-021/022, P16-DSP | implemented | local-verified | not-assessed |
| Unit test | P06-023/024 | implemented | pilot-verified | not-assessed |
| Deterministic artifact | P06-028, P07-001/002/014 | implemented | pilot-verified | not-assessed |
| Safe evidence | P06-024/035, P10-025 | implemented | local-verified | not-assessed |
| Coverage enforcement | P06-024/025 | implementation-gap | not-verified | not-assessed |
| Runner routing | P09-001/002/010/011 | implemented | not-verified | not-assessed |
| SAST | P16-SAP | planned | not-verified | not-assessed |
| SBOM dan signing | P07-015/016/017, P16-SBM | planned | not-verified | not-assessed |

Gunakan JSON untuk path implementasi, test reference, check ID, dan catatan gap
lengkap. Matriks wajib diperbarui pada pull request yang menambah, menghapus,
atau mengubah perilaku capability.

## Decision gate

- `implemented` tanpa verification: jangan masukkan ke certified bundle.
- `implementation-gap`: jadwalkan technical remediation.
- `governance-gap`: hentikan rollout dan selesaikan approval/control mapping.
- `conflict`: implementasi tidak boleh digabung sebelum governance decision.
- `not-assessed`: jangan memakai kata compliant pada README, release, atau handoff.
