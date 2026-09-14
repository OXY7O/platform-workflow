# Boundary Penyerahan ke Delivery Privat

`platform-workflow` berhenti setelah menghasilkan dan memverifikasi artifact publik yang immutable. Repository ini tidak menyimpan credential deployment, target host, SSH key, kubeconfig, maupun workflow yang menggunakan self-hosted runner internal.

## Kontrak boundary

Output publik yang dapat diserahkan ke control plane privat mencakup:

- repository dan commit SHA sumber;
- repository workflow dan commit SHA workflow;
- artifact ID, OCI digest, dan immutable image reference;
- referensi provenance atau attestation;
- target ID, environment, authorization reference, dan LKG digest bila tersedia.

`platform-provisioning` wajib memverifikasi ulang seluruh identitas tersebut sebelum mengalokasikan runner internal. Kontrak tidak boleh menerima hostname, username, private key, token, port, perintah shell, atau nilai runtime aplikasi dari pemohon.

## Pembagian tanggung jawab

| Area | Repository publik | Control plane privat |
|---|---|---|
| Build, test, dan security checks | Ya | Tidak |
| OCI, SBOM, provenance, dan attestation | Ya | Verifikasi ulang |
| Credential dan jaringan internal | Tidak | Ya, melalui GitHub Environment |
| Self-hosted runner internal | Tidak | Ya, setelah verifikasi |
| Deployment, health check, LKG, rollback | Tidak | Ya |
| Safe deployment evidence | Tidak | Ya |

Status CI atau publikasi OCI bukan authorization deployment. Approval environment dan kebijakan delivery tetap dijalankan di control plane privat.
