# Desain Katalog Platform Workflow dan Penamaan Example

## 1. Tujuan

Menyusun dokumentasi `platform-workflow` sebagai portal implementasi teknis
lintas tech stack yang mudah dipahami manusia tanpa menghilangkan detail
kontrak, workflow, artifact, compatibility, evidence, dan onboarding.

Desain ini juga menstandarkan istilah `example` untuk repository implementasi
referensi. Repository `demo-app-laravel` diubah menjadi
`example-app-laravel`, dan stack berikutnya mengikuti pola
`example-app-<profile>`.

## 2. Hubungan Source of Truth

Alur informasi resmi adalah:

```text
platform-governance
  menetapkan policy, lifecycle, rule, control, dan evidence requirement
        |
platform-workflow
  menerapkan reusable workflow dan menyediakan katalog profile
        |
example-app-<profile>
  membuktikan penggunaan teknis dari sisi consumer aplikasi
        |
onboarding
  memandu developer mengadopsi profile ke repository aktual
```

Setiap lapisan hanya menjelaskan tanggung jawabnya. Dokumentasi workflow tidak
mengulang seluruh policy governance, dan example tidak menjadi source of truth
untuk reusable workflow.

## 3. Arsitektur Dokumentasi Platform Workflow

### 3.1 README utama

`platform-workflow/README.md` menjadi landing page umum, bukan halaman khusus
PHP/Laravel. Halaman ini wajib memuat:

1. tujuan dan posisi `platform-workflow`;
2. hubungan dengan `platform-governance` dan repository example;
3. persona pengguna dan jalur pembacaan;
4. gambaran reusable workflow, thin caller, artifact, dan evidence;
5. katalog tech stack;
6. cara memilih profile;
7. aturan pin immutable;
8. batas deployment;
9. link onboarding dan troubleshooting umum.

Badge dibatasi pada informasi lintas profile:

- release;
- status validasi repository;
- governance baseline;
- deployment scope.

Badge profile PHP/Laravel dan lifecycle profile tidak berada pada README utama.

### 3.2 Katalog tech stack

Katalog menampilkan status secara tekstual, bukan badge per baris.

| Family | Profile | Status awal | Detail | Example |
|---|---|---|---|---|
| PHP | `php-laravel` | Available | link aktif | `example-app-laravel` |
| Go | `go-service` | Planned | belum ada link implementasi | direncanakan |
| .NET | `dotnet-webapi` | Planned | belum ada link implementasi | direncanakan |
| Python | `python-django` | Planned | belum ada link implementasi | direncanakan |
| TypeScript/Node.js | `node-service` | Planned | belum ada link implementasi | direncanakan |
| Java | `java-spring-boot` | Planned | belum ada link implementasi | direncanakan |

Status `Planned` tidak boleh memiliki link yang memberi kesan bahwa workflow
sudah tersedia. Status katalog README berubah menjadi `Available` setelah
workflow, example, pengujian, evidence, dan release tersedia. `Available`
menyatakan ketersediaan implementasi, bukan status support/compliance. Status
governance tetap `pilot/not-validated` sampai template repository, TCV, EVD,
dan audit yang diwajibkan tersedia.

### 3.3 Halaman detail profile

PHP/Laravel dipindahkan ke
`docs/profiles/php-laravel/README.md`. Halaman profile wajib memuat:

- identitas, status, owner fungsi, dan governance baseline;
- use case yang didukung;
- prasyarat aplikasi;
- reusable workflow yang tersedia;
- canonical dan compatibility lane;
- matriks Laravel/PHP;
- kontrak input dan output;
- artifact serta safe evidence metadata;
- thin caller dan immutable pin;
- batas keamanan dan deployment;
- troubleshooting;
- onboarding checklist;
- link ke `example-app-laravel`.

Dokumen teknis yang sudah ada tetap menjadi halaman khusus. Landing page profile
mengorganisasikan link tersebut agar pengguna tidak perlu mencari file sendiri.

## 4. Standard Penamaan Example

### 4.1 Repository

Pola resmi adalah `example-app-<profile>`.

Perubahan pertama:

- sebelum: `OXY7O/demo-app-laravel`;
- sesudah: `OXY7O/example-app-laravel`.

Stack selanjutnya menggunakan pola yang sama, misalnya
`example-app-go`, `example-app-dotnet`, dan `example-app-python`.

### 4.2 Terminologi

- `example` atau “contoh implementasi” digunakan untuk repository dan panduan
  teknis yang dapat dipelajari developer;
- `pilot` tetap digunakan untuk tahap validasi dan evidence;
- `demo` tidak digunakan pada dokumentasi aktif, metadata aktif, nama package,
  badge, atau katalog;
- riwayat Git dan isi release lama tidak ditulis ulang, tetapi dokumentasi aktif
  tidak boleh mengarahkan pengguna ke nama lama.

### 4.3 Migrasi rename

Rename mencakup:

- nama repository GitHub;
- local remote URL;
- README, badge, release link, dan clone URL;
- package name serta repository policy;
- referensi aktif di `platform-governance` dan `platform-workflow`;
- workflow metadata, evidence reference, dan traceability yang merupakan
  petunjuk aktif;
- validasi repository dan pengujian dokumentasi.

GitHub redirect dari nama lama boleh tetap tersedia, tetapi bukan rujukan resmi.

## 5. README Example App Laravel

`example-app-laravel/README.md` menjadi panduan teknis onboarding dengan urutan:

1. fungsi example dan batas scope;
2. hubungan governance, workflow, dan example;
3. prasyarat lokal;
4. cara menjalankan canonical app;
5. cara menjalankan compatibility variant;
6. cara membaca thin caller;
7. matriks versi;
8. artifact dan evidence;
9. langkah adopsi ke repository aplikasi;
10. checklist onboarding;
11. troubleshooting dan link profile.

README mempertahankan perintah teknis yang dapat disalin, tetapi setiap perintah
diberi konteks: tujuan, lokasi eksekusi, hasil yang diharapkan, dan batasannya.

Badge example dibatasi pada:

- release;
- status CI;
- profile;
- jenis repository sebagai example;
- deployment scope.

## 6. Paket Onboarding

Halaman profile PHP/Laravel menyediakan checklist onboarding yang mengarahkan
developer untuk:

1. memverifikasi bahwa profile sesuai dengan jenis workload;
2. memilih versi canonical atau compatibility yang masih didukung;
3. memastikan manifest dan lock file tersedia;
4. menyalin thin caller;
5. menetapkan input terkontrol;
6. mem-pin reusable workflow ke full commit SHA;
7. menjalankan validasi lokal;
8. membuka pull request;
9. memverifikasi required check dan artifact;
10. mencatat evidence serta owner;
11. memahami bahwa `ci-qualified` bukan izin deployment.

Checklist tidak menyimpan secret, username aktual, atau evidence sensitif.

## 7. Tautan dan Navigasi

Navigasi wajib memungkinkan jalur berikut tanpa pencarian manual:

```text
platform-workflow README
  -> katalog PHP/Laravel
  -> detail profile PHP/Laravel
  -> thin caller / kontrak / troubleshooting
  -> example-app-laravel
  -> onboarding checklist
```

Example menyediakan backlink ke halaman profile dan governance baseline.
Tautan lintas repository menggunakan URL GitHub canonical. Tautan internal
menggunakan relative path.

## 8. Validasi dan Acceptance Criteria

Implementasi selesai apabila:

1. README utama bersifat lintas tech stack dan tidak lagi berpusat pada PHP;
2. katalog menampilkan satu profile `Available` dan lima profile `Planned`;
3. halaman detail PHP/Laravel tersedia dan mengorganisasikan seluruh materi
   teknis serta onboarding;
4. repository GitHub bernama `example-app-laravel`;
5. tidak ada referensi aktif `demo-app-laravel` pada README, katalog,
   metadata aktif, workflow, atau panduan onboarding;
6. README example menjelaskan penggunaan teknis end-to-end;
7. badge sesuai batas yang disepakati;
8. seluruh link lokal valid;
9. seluruh repository validation dan test lulus;
10. PR menjelaskan rename dan dampak redirect;
11. release patch diterbitkan setelah merge dengan catatan migrasi nama.

## 9. Batas Scope

Perubahan ini tidak:

- mengimplementasikan Go, .NET, Python, Node.js, atau Java workflow;
- mengaktifkan deployment;
- mengubah kontrak CI PHP/Laravel atau compatibility matrix;
- mengubah evidence sensitif yang sudah disimpan di luar repository;
- menghapus riwayat release lama.
