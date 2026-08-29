# Thin Caller PHP/Laravel

Thin caller hanya memilih parameter yang diizinkan. Urutan pemeriksaan, command,
taxonomy, dan packaging tetap dimiliki `platform-workflow`.

Gunakan [contoh caller](../../../examples/thin-caller-php-laravel.yml), kemudian
tetapkan versi PHP, test profile (`phpunit` atau `pest`), working directory
relatif, coverage 0–100, retention 1–30 hari, serta extension dari allowlist.

Caller wajib memakai full commit SHA. Tag membantu discovery release, tetapi
tidak menggantikan pin immutable. Jangan tambahkan arbitrary command atau
`secrets: inherit`. Output `ci-qualified` bukan izin deployment.

## Dua jalur caller

- **Canonical artifact:** memanggil `ci-profile-php-laravel.yml`; hanya lane
  ini yang membangun dan mengunggah `application-package`.
- **Compatibility-only:** matrix memanggil
  `ci-compatibility-php-laravel.yml`; output hanya readiness, kategori
  kegagalan, digest kontrak/lock, dan safe evidence metadata.

Compatibility caller tidak menerima secret, environment, command bebas,
retention, atau konfigurasi packaging. Catalogue diproses oleh
`generate-compatibility-matrix` dan setiap lane divalidasi kembali oleh
`validate-compatibility-contract`.

Kembali ke [landing page PHP/Laravel](README.md).
