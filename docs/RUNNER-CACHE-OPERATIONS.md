# Operasi Cache Runner `platform-ci`

Dokumen ini mengatur cache lokal pada self-hosted runner. Tujuannya mempercepat
CI tanpa memasang runtime secara native pada host dan tanpa menjadikan cache
sebagai evidence atau artifact.

## Model cache

| Lapisan | Lokasi | Isolasi | Isi yang diperbolehkan |
|---|---|---|---|
| Image | Docker image store host | Image dan digest immutable | Image PHP/Node yang disetujui |
| Composer | Named volume `platform-ci-composer-php-<version>` | Versi PHP | Unduhan package Composer |
| npm | Named volume `platform-ci-npm-node-<major>` | Major Node.js | Unduhan package npm |

Workspace, `vendor`, `node_modules`, secret, token, source hasil modifikasi,
artifact, dan evidence tidak boleh disimpan pada volume cache.

## Warmup dan maintenance

Jalankan `scripts/maintain-runner-cache.sh` pada host runner setelah instalasi,
setelah perubahan katalog image, dan secara terjadwal satu kali per hari. Script:

1. menarik seluruh image approved berdasarkan digest;
2. membersihkan layer dangling berusia lebih dari tujuh hari;
3. membersihkan build cache lama sambil mempertahankan maksimum 10 GB;
4. tidak menjalankan `volume prune` dan tidak menghapus seluruh image;
5. menampilkan penggunaan disk sebagai evidence operasional.

Contoh penjadwalan dilakukan oleh operator host, bukan workflow dari pull
request. Pemisahan ini mencegah job aplikasi memperoleh akses ke Docker socket.

## Integritas dan keamanan

- `composer.lock` atau lockfile ekuivalen selalu divalidasi dan digunakan ulang;
- dependency tetap diinstal ulang ke workspace yang bersih pada setiap job;
- caller tidak dapat menentukan nama volume atau cache key bebas;
- perubahan versi runtime menghasilkan volume berbeda;
- cache dapat dihapus kapan saja tanpa mengubah kebenaran hasil CI;
- GitHub-hosted cache bukan default dan memerlukan keputusan platform terpisah.

## Pemulihan

Jika cache diduga rusak, hentikan job baru, hapus hanya named volume yang tepat,
jalankan kembali maintenance untuk warmup image, lalu ulangi CI. Jangan menghapus
semua volume Docker karena host dapat melayani workload lain.
