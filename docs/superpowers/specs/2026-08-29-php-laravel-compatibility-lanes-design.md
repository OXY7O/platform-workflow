# PHP Laravel Compatibility Lanes Design

**Tanggal:** 2026-08-29  
**Status:** Disepakati untuk perencanaan implementasi  
**Repository terkait:** `OXY7O/platform-workflow`, `OXY7O/demo-app-laravel`  
**Baseline:** `platform-governance v1.1.0`, `platform-workflow v0.1.2`, `demo-app-laravel v0.1.0`

## Tujuan

Memperluas pilot Laravel menjadi validasi compatibility yang mencakup beberapa versi PHP dan Laravel dalam satu repository demo, tanpa membuat artifact yang ambigu. Setiap dependency lane wajib mempunyai `composer.json` dan `composer.lock` sendiri agar hasil reproducible dan tidak bergantung pada dynamic dependency resolution ketika CI berjalan.

## Keputusan Arsitektur

Repository `demo-app-laravel` tetap menjadi satu katalog implementasi untuk family PHP/Laravel. Root repository adalah canonical lane. Compatibility lintas major Laravel ditempatkan pada direktori terpisah dengan lock file independen.

```text
demo-app-laravel/
├── app/                              # Laravel 13 canonical source
├── composer.json                     # Laravel 13 canonical dependency contract
├── composer.lock
├── compatibility/
│   ├── php-laravel.json              # Lifecycle dan execution catalogue
│   ├── laravel-12/
│   │   ├── composer.json
│   │   ├── composer.lock
│   │   └── compatibility-contract.json
│   └── laravel-8/
│       ├── composer.json
│       ├── composer.lock
│       └── compatibility-contract.json
└── .github/workflows/ci.yml
```

Source compatibility lane harus seminimal mungkin. Shared domain behavior dan contract test boleh digunakan ulang, tetapi dependency manifests dan bootstrap framework tidak boleh dipalsukan atau dihasilkan ulang saat CI.

## Matriks Eksekusi

| Lane | Laravel | PHP | Lifecycle | Blocking | Menghasilkan artifact |
|---|---:|---|---|---|---|
| Canonical | 13 | 8.3 | `security-only` | Ya | Ya |
| Current compatibility | 13 | 8.4, 8.5 | `active` | Ya | Tidak |
| Laravel 12 compatibility | 12 | 8.2, 8.3, 8.4, 8.5 | `security-only` atau `active` | Ya | Tidak |
| Preview | versi yang dinyatakan kompatibel | 8.6 | `preview` | Tidak | Tidak |
| Legacy exception | 8 | 7.4 | `legacy-eol` | Tidak secara default | Tidak |

PHP 8.6 hanya dijalankan setelah runtime tersedia pada runner dan dependency lane dapat di-resolve secara sah. Kegagalan preview dicatat sebagai gap, tetapi tidak menggagalkan canonical readiness.

PHP 7.4 tidak berjalan pada pull request reguler. Lane hanya dapat dipicu melalui workflow manual dengan `exceptionId`, `migrationTarget`, dan `expirationDate` yang valid. Hasilnya tidak boleh mengubah status canonical artifact.

## Pemisahan Canonical dan Compatibility

`platform-workflow` menyediakan dua kontrak reusable:

1. `ci-profile-php-laravel.yml` tetap menjadi canonical pipeline. Pipeline menjalankan dependency validation, test, coverage, package build, manifest, digest, upload, dan safe evidence.
2. Reusable workflow baru `ci-compatibility-php-laravel.yml` hanya menjalankan dependency installation dan test berdasarkan lane yang dikontrol. Workflow tidak memiliki package build, upload-artifact, environment, deployment, atau secret input.

Caller demo memiliki dua job terpisah:

- `canonical-artifact` memanggil workflow canonical satu kali untuk PHP 8.3.
- `compatibility` memanggil workflow compatibility menggunakan matrix yang dibentuk dari catalogue tervalidasi.

Pemisahan job membuat status artifact tidak bergantung pada jumlah runtime yang diuji dan mencegah setiap matrix cell menghasilkan artifact dengan identitas berbeda.

## Kontrak Compatibility

Setiap matrix item menggunakan typed JSON contract dengan field minimum:

```json
{
  "schemaVersion": "1.0",
  "profileKey": "php-laravel",
  "laneId": "laravel-12-php-8.2",
  "frameworkMajor": 12,
  "phpVersion": "8.2",
  "workingDirectory": "compatibility/laravel-12",
  "dependencyMode": "composer-frozen",
  "testCommandProfile": "phpunit",
  "executionMode": "compatibility-only",
  "lifecycle": "security-only",
  "blocking": true
}
```

Caller tidak boleh mengirim shell command. `workingDirectory`, execution mode, lifecycle, test preset, dan versi runtime divalidasi terhadap allowlist catalogue. Directory absolut dan path traversal ditolak.

## Data Flow

1. Repository validator membaca `compatibility/php-laravel.json` dan seluruh lane contract.
2. Generator matrix menghasilkan JSON untuk lane reguler yang eligible.
3. Caller meneruskan setiap item ke reusable compatibility workflow.
4. Workflow memvalidasi contract, mengonfigurasi PHP, menginstal dependency dari lock file, dan menjalankan preset test.
5. Setiap lane menghasilkan normalized check result dan safe evidence metadata, tanpa application package.
6. Aggregator membedakan required failure, preview failure, dan legacy informational result.
7. Canonical workflow tetap menjadi satu-satunya sumber `application-package` dan readiness `ci-qualified`.

## Error Handling

| Kondisi | Kategori | Dampak |
|---|---|---|
| Contract tidak cocok catalogue | `contract` | Lane gagal sebelum dependency install |
| Lock file hilang atau berubah | `dependency` | Required lane gagal |
| Test required lane gagal | `test` | Compatibility check gagal dan merge diblokir |
| Preview lane gagal | `compatibility-preview` | Gap tercatat, merge tidak diblokir |
| Legacy lane tanpa exception | `exception` | Eksekusi ditolak |
| Compatibility workflow mencoba membuat artifact | `platform` | Repository validation gagal |

Diagnostic harus aman dan tidak memuat environment value, credential, raw dependency token, atau isi secret.

## Evidence

Compatibility evidence disimpan terpisah dari canonical artifact evidence. Record minimum mencakup source SHA, reusable workflow SHA, lane ID, PHP version, framework major, contract digest, lock digest, lifecycle, blocking status, conclusion, failure category, run URL, dan evidence reference.

Tidak ada binary artifact dari compatibility lane. Jika log lengkap dibutuhkan untuk audit, log tetap berada pada GitHub Actions atau external evidence storage sesuai governance retention; repository hanya menyimpan metadata aman.

## Pengujian

Implementasi mengikuti TDD dan mencakup:

- contract schema menerima lane yang sah dan menolak command/path traversal;
- matrix generator deterministik dan hanya memilih lane eligible;
- canonical job tetap tunggal dan tetap menghasilkan artifact;
- compatibility job tidak mempunyai build, upload, deployment, environment, atau secret;
- blocking lane failure memblokir hasil compatibility;
- preview failure dinormalisasi tanpa memblokir canonical readiness;
- legacy lane ditolak tanpa exception metadata;
- setiap lane memakai lock file dan preset test yang dimiliki platform;
- end-to-end run pada `demo-app-laravel` membuktikan PHP/Laravel matrix aktual.

## Rollout

1. Tambahkan contract, matrix generator, reusable compatibility workflow, dan tests di `platform-workflow`.
2. Rilis patch/minor `platform-workflow` dengan full immutable SHA.
3. Tambahkan Laravel 12 lane dan current compatibility lane di `demo-app-laravel`.
4. Jalankan pilot required matrix dan catat evidence.
5. Tambahkan preview PHP 8.6 ketika runner/dependency tersedia.
6. Tambahkan Laravel 8/PHP 7.4 hanya setelah template exception dan migration record siap digunakan.

## Batas Scope

- Tidak ada deployment.
- Tidak ada dynamic `composer update` pada CI.
- Tidak ada artifact dari compatibility lane.
- Tidak ada dukungan framework di luar Laravel pada perubahan ini.
- Tidak ada aktivasi PHP 7.4 reguler tanpa exception.
- Tidak ada klaim compatibility hanya berdasarkan catalogue; status validated diberikan setelah lane benar-benar lulus pada GitHub Actions.

## Kriteria Selesai

- Canonical PHP 8.3 tetap menghasilkan tepat satu verified artifact.
- Laravel 13 pada PHP 8.4 dan 8.5 lulus sebagai required compatibility-only jobs.
- Laravel 12 mempunyai lock file independen dan required lane yang tervalidasi.
- Preview dan legacy mengikuti aturan blocking serta trigger yang ditetapkan.
- Seluruh evidence machine-readable dan tidak mengandung secret.
- PR demo app hijau tanpa mengubah batas tanpa deployment.
