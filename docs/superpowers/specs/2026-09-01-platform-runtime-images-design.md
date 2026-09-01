# Platform Runtime Images Design

**Status:** Disetujui untuk review desain  
**Tanggal:** 2026-09-01  
**Repository target:** `OXY7O/platform-runtime-images`  
**Consumer pertama:** `OXY7O/platform-workflow` profile PHP Laravel

## Tujuan

Menyediakan CI toolchain image yang terkontrol, reproducible, tervalidasi, dan
dipin secara immutable. Image menghilangkan instalasi runtime native pada
self-hosted runner serta bootstrap PHP berulang pada setiap job.

Repository ini menjadi image factory. Ia tidak menggantikan
`platform-workflow`, template aplikasi, example application, atau application
runtime image.

## Keputusan yang dikunci

- Image factory berada pada repository terpisah `platform-runtime-images`.
- Repository image factory boleh private; package GHCR hasil release dibuat
  public setelah seluruh release gate lulus.
- GHCR public menjadi registry distribusi default.
- Registry yang dikelola mandiri harus dapat digunakan tanpa mengubah kontrak
  logical image dan tanpa menurunkan kontrol digest.
- Consumer selalu menggunakan registry reference dengan digest immutable;
  `latest` tidak diperbolehkan.
- Kloter pertama hanya menghasilkan CI toolchain image PHP 8.2, 8.3, 8.4, dan
  8.5 untuk Laravel.
- Target awal hanya Linux `amd64`, sesuai runner `platform-ci`; `arm64` tetap
  planned sampai diuji pada runner aktual.
- Dependency cache Composer/npm tetap berada pada named volume runner dan tidak
  dibake ke image.
- CI toolchain image, developer environment image, dan application runtime
  image adalah tiga produk berbeda.

## Batas produk image

### CI toolchain image

Digunakan secara tidak langsung oleh developer ketika thin caller memanggil
reusable workflow. Image memuat tool untuk build, test, quality, security
baseline, dan packaging.

### Developer environment image

Dev Container atau local development image tidak termasuk kloter ini. Produk
tersebut kelak boleh memakai komponen dasar yang sama, tetapi harus mempunyai
identifier, lifecycle, dan release terpisah.

### Application runtime image

Image deployment aplikasi dibuat dari artifact yang qualified dan harus
minimal. Composer, Node.js, Xdebug, compiler, test runner, dan tool CI tidak
boleh ikut hanya karena tersedia pada CI toolchain image.

## Arsitektur

```text
platform-governance
  -> policy runtime, dependency, security, artifact, lifecycle

platform-runtime-images
  -> build controlled CI image
  -> smoke/integration test
  -> vulnerability scan + SBOM + provenance
  -> publish GHCR public
  -> optional mirror to self-managed registry
  -> release catalogue containing exact digests

platform-workflow
  -> consumes logical image release as literal registry@sha256 reference
  -> mounts version-isolated dependency cache
  -> performs CI checks and packaging

example-app-laravel
  -> validates every supported lane on the actual platform-ci runner
```

Job aplikasi tidak memperoleh Docker socket atau hak untuk membangun/mengubah
toolchain image. Publishing hanya dilakukan oleh image factory pada workflow
release yang terlindungi.

## PHP Laravel image contract

Logical identifiers kloter pertama:

- `php-ci/8.2`;
- `php-ci/8.3`;
- `php-ci/8.4`;
- `php-ci/8.5`.

Setiap image memuat:

- exact PHP patch release dari base image yang dipin digest;
- Composer major 2 dengan exact resolved version;
- Node.js major 24 dan npm dengan exact resolved version;
- Xdebug yang kompatibel dengan versi PHP;
- extension baseline Laravel: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`,
  `intl`, `mbstring`, `opcache`, `pcntl`, `pdo`, `pdo_mysql`, `tokenizer`,
  `xml`, dan `zip`;
- CA certificates, Git, unzip, dan tool dasar yang benar-benar diperlukan oleh
  Composer serta action runtime;
- non-secret metadata OCI untuk source revision, build date, image version,
  licenses, dan documentation URL.

Versi exact dicatat pada release catalogue, SBOM, dan output perintah
`php-ci-doctor`. Image tidak membawa source aplikasi, `vendor`, `node_modules`,
credential, secret, environment value, deployment configuration, ataupun
cache dependency.

## Build dan pengujian

Satu Dockerfile family menggunakan matrix terkontrol, tetapi menghasilkan
image terpisah per minor PHP. Build argument tidak boleh diterima dari caller
eksternal; nilainya berasal dari machine-readable catalogue yang direview.

Pull request menjalankan:

1. lint Dockerfile dan validasi catalogue;
2. build tanpa publish untuk setiap lane berubah;
3. pemeriksaan exact PHP, Composer, Node.js, npm, Xdebug, dan extension;
4. Composer install dari fixture Laravel dengan lockfile;
5. PHPUnit smoke test;
6. validasi user, filesystem, CA trust, dan tidak adanya secret;
7. vulnerability scan serta pembuatan SBOM sementara.

Release membangun ulang dari commit yang sama, menghasilkan provenance,
menandatangani image, memublikasikan image, kemudian melakukan pull-by-digest
dan mengulangi smoke test. Digest hasil verifikasi menjadi satu-satunya digest
yang boleh masuk release catalogue.

## Security dan supply chain

- Base image dan action eksternal dipin dengan full digest/SHA.
- Publish memakai permission minimum; signing keyless memakai OIDC hanya pada
  protected release environment.
- SBOM SPDX atau CycloneDX, provenance, signature, scan summary, source SHA,
  serta image digest disimpan sebagai release evidence.
- Temuan Critical atau High yang memiliki fix dan melanggar policy menggagalkan
  release. Exception harus memiliki ID, owner, expiry, dan remediation.
- Pull request dari fork tidak memperoleh credential publish.
- Image final berjalan dengan user non-root bila seluruh action Laravel telah
  dibuktikan kompatibel; sampai saat itu root-in-container dicatat sebagai gap,
  tidak disamarkan sebagai compliant.
- Image direbuild berkala setiap minggu dan segera ketika base/security update
  yang relevan tersedia.

## Registry dan portabilitas

Logical image tidak mengandung hostname registry. Machine-readable release
catalogue memetakan satu logical image ke satu atau lebih lokasi:

```json
{
  "logicalId": "php-ci/8.3",
  "release": "2026.09.0",
  "locations": {
    "ghcr-public": {
      "registry": "ghcr.io",
      "repository": "oxy7o/platform-ci-php",
      "digest": "sha256 value from the verified release output"
    },
    "self-managed": null
  }
}
```

GHCR public adalah lokasi aktif awal. Registry mandiri ditambahkan melalui
mirror pipeline yang:

1. menyalin manifest/layer dari digest approved;
2. memverifikasi digest dan platform setelah copy;
3. menjalankan signature, SBOM, dan smoke verification;
4. memperbarui catalogue melalui pull request;
5. tidak mengubah logical ID atau release identity.

Karena job container harus dipilih sebelum step pertama berjalan,
`platform-workflow` tidak membaca registry secara dinamis ketika job sedang
berjalan. Generator terkontrol merender literal `registry@sha256` dari release
catalogue ke workflow, kemudian perubahan direview dan diuji. Cara ini mencegah
caller memilih registry atau image arbitrer.

## Cache runner

Docker host menyimpan layer image berdasarkan digest. Script maintenance runner
melakukan pre-pull seluruh digest aktif setelah release catalogue berubah.

Composer dan npm menggunakan named volume terpisah per major/minor runtime.
Lockfile tetap diverifikasi dan dependency selalu diinstal ulang ke workspace
bersih. Cache hanya berisi unduhan package, dapat dihapus kapan saja, dan tidak
menjadi evidence.

Cleanup hanya menghapus dangling layer/build cache berdasarkan usia serta batas
kapasitas. Approved image di-warm kembali, sedangkan `volume prune`, global
`--all`, dan penghapusan workspace luas tidak diperbolehkan.

## Lifecycle dan versioning

Image release memakai CalVer untuk bundle toolchain, misalnya `2026.09.0`, dan
selalu dipakai oleh consumer melalui digest. Alias manusia seperti `php-8.3`
hanya untuk discovery dan tidak boleh digunakan workflow.

Setiap lane berstatus:

- `canonical`: default untuk project baru;
- `maintenance`: masih diuji dan menerima security rebuild;
- `legacy`: exception-only dengan migration target dan expiry;
- `retired`: tidak dibangun atau dipakai oleh workflow aktif.

Promosi lifecycle mengikuti technology support catalogue. Perubahan patch
tooling atau security rebuild menghasilkan release baru dan digest baru,
meskipun minor PHP tetap sama.

## Integrasi consumer

`platform-workflow` mengganti `setup-php` dengan image approved yang telah
membawa seluruh toolchain. Workflow melakukan doctor check pada awal job untuk
memastikan versi/extension sesuai kontrak sebelum memproses source caller.

`example-app-laravel` harus membuktikan:

- canonical artifact lane;
- seluruh required compatibility lane;
- cache cold run dan warm run menghasilkan hasil/digest yang setara;
- cache corrupt/missing dapat dipulihkan tanpa perubahan hasil;
- tidak ada native runtime yang dipasang pada host runner;
- evidence memuat logical image ID, release, dan digest aktual.

Status operationally verified hanya diberikan setelah actual runner evidence
lulus. Test lokal dan image build saja tidak cukup.

## Failure handling

- Build gagal: tidak publish dan catalogue tidak berubah.
- Scan/sign/provenance gagal: release ditolak.
- Mirror registry gagal: lokasi lama tetap aktif; tidak ada failover diam-diam.
- Doctor check gagal: job berhenti sebagai `platform-failure` sebelum dependency
  atau source execution.
- Digest tidak dikenal: workflow ditolak oleh repository validation.
- Cache rusak: hapus hanya volume terkait dan ulangi job; image tidak direbuild.

## Repository awal

```text
platform-runtime-images/
├── .github/workflows/
│   ├── validate.yml
│   ├── release.yml
│   └── mirror.yml
├── images/php-ci/
│   ├── Dockerfile
│   ├── doctor.sh
│   └── test/
├── catalogue/
│   ├── php-ci.json
│   └── release.schema.json
├── policies/
│   └── vulnerability-policy.json
├── scripts/
│   ├── validate-catalogue.sh
│   ├── verify-image.sh
│   └── render-consumer-reference.sh
├── docs/
│   ├── OPERATIONS.md
│   ├── REGISTRY-MIGRATION.md
│   └── TROUBLESHOOTING.md
├── CHANGELOG.md
└── README.md
```

## Urutan implementasi

1. Buat repository dan kontrak catalogue tanpa publish credential.
2. Implementasikan PHP 8.3 sebagai vertical slice dan buktikan build/test/scan.
3. Aktifkan GHCR public release, provenance, signing, serta pull-by-digest test.
4. Tambahkan PHP 8.2, 8.4, dan 8.5 melalui matrix yang sama.
5. Perbarui `platform-workflow` untuk doctor check dan digest release.
6. Pre-pull image approved pada runner `platform-ci`.
7. Jalankan cold/warm cache pilot di `example-app-laravel`.
8. Catat evidence aktual dan baru nyatakan runtime image operationally verified.
9. Dokumentasikan simulasi mirror registry mandiri tanpa mengaktifkan cutover.

## Di luar scope kloter pertama

- developer Dev Container;
- application runtime/deployment image;
- deployment ke VM atau Kubernetes;
- multi-architecture release;
- registry failover otomatis;
- family Go, .NET, Python, Java, atau Node.js;
- private package registry credential;
- klaim organization-wide compliance sebelum assessment aktual.
