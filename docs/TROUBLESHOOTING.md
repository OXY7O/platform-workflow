# Pemecahan Masalah

1. Periksa `failure-category` dan check yang gagal.
2. Untuk `contract`, validasi JSON terhadap schema input.
3. Untuk `dependency`, pastikan `composer.lock` dikomit dan konsisten.
4. Untuk `test` atau `quality`, jalankan preset yang sama; caller tidak boleh mengganti preset dengan command bebas.
5. Untuk `artifact`, pastikan source tidak memiliki `.env` atau private key.
6. Untuk `platform`, eskalasikan run URL, source SHA, workflow SHA, dan evidence reference tanpa nilai sensitif.

Perubahan baseline atau exception harus melalui governance; jangan melemahkan check di repository aplikasi.
