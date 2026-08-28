# Kategori Kegagalan

Kategori resmi dibaca dari [failure-taxonomy.json](../contracts/failure-taxonomy.json): `contract`, `dependency`, `quality`, `test`, `security`, `artifact`, dan `platform`. Hasil check dinormalisasi agar caller dan auditor tidak menebak penyebab dari teks log.

Diagnostik yang diekspor harus aman dan tidak memuat secret, token, private key, environment file, atau isi konfigurasi sensitif.
