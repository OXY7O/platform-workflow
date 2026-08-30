# Katalog Profile Platform Workflow

Halaman ini merangkum profile implementasi yang dikelola `platform-workflow`.
Status di sini menyatakan ketersediaan implementasi, bukan klaim compliance.

| Profile | Family | Availability | Governance lifecycle | Compatibility | Detail |
|---|---|---|---|---|---|
| `php-laravel` | PHP | Available | pilot | not-validated | [PHP/Laravel](php-laravel/README.md) |
| `go-service` | Go | In progress | pilot | not-validated | [Go Service](go-service/README.md) |
| `dotnet-webapi` | .NET | Planned | planned | not-validated | Belum tersedia |
| `python-django` | Python | Planned | planned | not-validated | Belum tersedia |
| `node-service` | TypeScript/Node.js | Planned | planned | not-validated | Belum tersedia |
| `java-spring-boot` | Java | Planned | planned | not-validated | Belum tersedia |

Profile `Planned` belum boleh dipakai sebagai baseline project. Perubahan menjadi
`Available` memerlukan reusable workflow, example repository, test, evidence,
dan release yang dapat ditelusuri.

Profile `In progress` sudah memiliki kandidat reusable workflow, tetapi belum
lengkap untuk onboarding umum. Penggunaan dibatasi pada persiapan atau pilot
yang disetujui sampai example dan evidence implementasinya tersedia.

Kembali ke [portal Platform Workflow](../../README.md).
