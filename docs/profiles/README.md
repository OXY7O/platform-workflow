# Katalog Profile Platform Workflow

Halaman ini merangkum profile implementasi yang dikelola `platform-workflow`.
Status di sini menyatakan ketersediaan implementasi, bukan klaim compliance.

| Profile | Family | Availability | Governance lifecycle | Compatibility | Detail |
|---|---|---|---|---|---|
| `php-laravel` | PHP | Available | pilot | not-validated | [PHP/Laravel](php-laravel/README.md) |
| `go-service` | Go | Available | pilot | not-validated | [Go Service](go-service/README.md) |
| `dotnet-webapi` | .NET | Available | pilot | not-validated | [.NET Web API](dotnet-webapi/README.md) |
| `python-django` | Python | Planned | planned | not-validated | Belum tersedia |
| `node-service` | TypeScript/Node.js | Planned | planned | not-validated | Belum tersedia |
| `java-spring-boot` | Java | Planned | planned | not-validated | Belum tersedia |

Profile `Planned` belum boleh dipakai sebagai baseline project. Perubahan menjadi
`Available` memerlukan reusable workflow, example repository, test, evidence,
dan release yang dapat ditelusuri.

Profile `Available` dapat memiliki lifecycle `pilot` dan compatibility
`not-validated`. Availability hanya berarti workflow serta example tersedia;
support dan compliance tetap memerlukan proses governance terpisah.

Dalam governed provisioning, profile hanya dapat dipilih melalui approved bundle.
Ketersediaan workflow dan example belum cukup: exact combination memerlukan
certification evidence yang masih valid. Jika belum tersedia, provisioner
menjalankan sandbox validation. Source example tidak disalin ke repository
developer; `template-app-*` tetap menjadi golden path source.

Kembali ke [portal Platform Workflow](../../README.md).
