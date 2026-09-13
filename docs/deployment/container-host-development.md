# Deployment Laravel ke container host development

Panduan ini menjelaskan capability pilot untuk menerbitkan image Laravel ke
private GHCR dan men-deploy image yang sama ke Docker Compose pada VM development.
Capability belum menjadi klaim operational compliance sampai pengujian aktual,
evidence formal, dan assessment organisasi selesai.

## Alur otomatis

```text
CI qualified source
  -> build OCI tanpa secret deployment
  -> push private GHCR + digest + SBOM + provenance
  -> validasi deployment contract
  -> GitHub Environment development
  -> platform-compose-deploy pada VM
  -> health check /up
  -> sukses: digest menjadi LKG
  -> gagal: rollback ke LKG bila tersedia
  -> upload safe evidence
```

Workflow publiknya adalah `build-oci-php-laravel.yml` dan
`deploy-container-host-development.yml`. Caller wajib mem-pin full commit SHA.

## Konfigurasi GitHub Environment

Buat environment bernama `development`. Atur reviewer bila kebijakan organisasi
mewajibkannya, lalu isi secret berikut pada scope environment—bukan repository:

| Nama | Kegunaan |
|---|---|
| `DEPLOY_SSH_PRIVATE_KEY` | Private key khusus user deployment |
| `DEPLOY_KNOWN_HOSTS` | Host key terverifikasi; bukan hasil scan saat job berjalan |
| `DEPLOY_TARGET_HOST` | Alamat target yang tidak pernah masuk evidence |
| `DEPLOY_TARGET_USER` | User deployment dengan privilege minimum |
| `REGISTRY_PULL_TOKEN` | Token read-only untuk menarik private GHCR image |

Jangan menyimpan passphrase, private key, hostname, IP, username, raw log, atau
nilai environment aplikasi dalam contract maupun evidence.

## Persiapan manual pada VM

Platform operator memasang Docker Engine, Compose, user deployment terbatas, dan
wrapper root-owned `platform-compose-deploy`. Wrapper hanya menerima operasi
`apply` dengan parameter allowlist; ia harus memvalidasi Compose, menarik image
berdasarkan digest, menjalankan service `web`, `queue`, atau `scheduler`, memeriksa
`/up`, mencatat LKG, dan menjalankan rollback bila health check gagal.

Inbound SSH dibatasi ke runner network. User deployment tidak memperoleh shell
administratif umum. Registry credential harus read-only dan dikelola terpisah.

## Contract aplikasi

Repository menyediakan `deploy/compose.yaml`. Image memakai
`${PLATFORM_IMAGE_REFERENCE}` dan tidak hard-code tag bergerak. Contract deployment
menetapkan target logis `laravel-development-container-host`, service allowlist,
timeout 10–300 detik, retry 1–30, artifact ID, source/workflow SHA, image digest,
dan LKG. Host, user, key, command, serta konfigurasi aplikasi tidak diterima.

Schema: [`container-host-deployment.schema.json`](../../contracts/container-host-deployment.schema.json).
Hasil evidence: [`deployment-result.schema.json`](../../contracts/deployment-result.schema.json).

## Health, LKG, dan rollback

Endpoint `/up` harus memeriksa kesiapan proses tanpa mengekspos data sensitif.
Setelah health check berhasil, digest aktif menjadi last-known-good (LKG). Jika
deployment baru gagal, executor mencoba rollback deployment ke digest LKG. Source
code tidak di-revert; perbaikannya tetap memakai working branch hingga main lalu
artifact baru dipromosikan kembali.

## Pembagian otomatis dan manual

| Otomatis | Manual |
|---|---|
| Validasi schema dan immutable digest | Membuat GitHub Environment |
| Login private GHCR secara scoped | Menyiapkan VM, firewall, user, dan wrapper |
| Transfer Compose dan invoke wrapper | Memverifikasi host key dan least privilege |
| Health check, LKG, rollback | Menyetujui authorization reference |
| Safe evidence upload | Menangani remediation dan exception |

## Troubleshooting

- `contract`: cocokkan target, digest, Compose path, service, dan governance version.
- `authorization`: periksa environment approval dan authorization reference.
- `pull`: periksa akses read-only private GHCR dan digest.
- `compose`: validasi schema Compose serta image placeholder.
- `health`: periksa `/up` dan log aplikasi langsung pada storage operasional.
- `rollback`: hentikan promotion, eskalasi ke operation, dan gunakan LKG yang tercatat.
- `platform`: periksa runner, SSH connectivity, known hosts, dan wrapper version.

Evidence aman hanya berisi identitas attempt, repository, environment, target,
SHA, artifact, digest, authorization, timestamp, hasil health, status rollback,
dan referensi governance. Raw log tetap berada pada sistem operasional terkontrol.
