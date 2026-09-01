# Blueprint Laravel CI

## Tujuan

Blueprint ini menerjemahkan control `platform-governance@v1.5.1` menjadi jalur
CI Laravel yang terpusat, dapat diuji, dan dapat ditelusuri. Scope saat ini
adalah development process sampai menghasilkan `ci-qualified` application
package dan Safe evidence metadata.

## Flow

```text
Pull request atau development merge
  → typed caller contract
  → sensitive material guard
  → PHP syntax
  → Composer validation dan frozen install
  → dependency audit
  → Laravel unit test preset
  → deterministic application package
  → granular normalized result
  → Safe evidence metadata
  → example-app-laravel verification
  → approved bundle platform-provisioning
```

## Security minimum

Security minimum yang menjadi bagian CI saat ini:

- `contents: read` sebagai permission default;
- external action dan reusable implementation dipin ke full commit SHA;
- caller tidak menerima arbitrary command, absolute path, traversal, secret,
  environment, atau `secrets: inherit`;
- `.env` dan private-key material ditolak sebelum dependency execution;
- Composer lock divalidasi dan dependency audit dijalankan;
- artifact menolak environment file, key, Git metadata, test source, dan pola
  sensitif yang ditetapkan profile;
- hasil check dan evidence tidak memuat secret atau raw diagnostic sensitif.

Sensitive material guard adalah preventive baseline, bukan pengganti GitHub
secret scanning atau scanner credential komprehensif.

## Required checks yang benar-benar tersedia

| Check | Control utama | Status |
|---|---|---|
| `sensitive-material-guard` | P06/P10/P16 | Implemented; example verification diperlukan setelah release |
| `php-syntax` | P06 test contract | Implemented; example verification diperlukan setelah release |
| `composer-lock` | P06 dependency integrity | Implemented dan pilot-verified |
| `dependency-audit` | P06/P16 dependency security | Implemented; severity policy dan example verification belum final |
| `unit-test` | P06 test contract | Implemented dan pilot-verified |
| `artifact-verify` | P06/P07 artifact integrity | Implemented dan pilot-verified |

Normalized result memakai check granular di atas. Check yang tidak berjalan
dicatat sebagai `not-run`; check yang gagal mempertahankan failure category
aslinya dan tidak boleh disamarkan sebagai artifact failure.

## Gap yang sengaja tetap terlihat

- Coverage threshold belum terikat pada report coverage terstandar.
- SAST, GitHub secret scanning integration, SBOM, provenance, dan signing belum
  memiliki tool, ACT assessment, severity gate, serta evidence contract final.
- Seluruh job Laravel diarahkan ke self-hosted runner berlabel `platform-ci` dan berjalan di dalam container PHP resmi yang dipin dengan digest immutable;
- host runner hanya menyediakan Linux, Docker, dan konektivitas keluar; PHP, Composer, extension, dan tooling aplikasi tidak dipasang secara native pada host;
- penarikan image pertama dapat lebih lama, sedangkan eksekusi berikutnya memanfaatkan cache image lokal runner;
- cache unduhan Composer memakai named volume persisten yang dipisahkan per versi PHP; `vendor`, workspace, artifact, evidence, dan secret tidak pernah dimasukkan ke cache;
- lockfile tetap menjadi sumber integritas. Cache hanya mempercepat unduhan dan tidak menggantikan `composer install` serta validasi dependency;
  successful workflow run masih diperlukan sebagai evidence operasional.
- Extension CI/CD/security tidak dapat dipilih sebelum executor dan negative
  test tersedia.

## Tidak termasuk

- container image build;
- deployment development, staging, atau production;
- environment credential dan OIDC;
- promotion, release authorization, atau rollback;
- status `supported` atau `operationally compliant`;
- template rendering dan pembuatan repository.

Deployment menjadi blueprint Laravel CD terpisah. Template dan repository
delivery dimiliki `platform-provisioning`; workflow ini hanya menyediakan
capability yang sudah disetujui.

## Gate menuju provisioning

Capability Laravel CI baru boleh masuk approved bundle setelah:

1. seluruh test repository lulus dan bundle `dist/` konsisten;
2. release workflow memiliki full immutable SHA;
3. `example-app-laravel` membuktikan positive dan negative path;
4. combination ID dan workflow SHA tercatat pada certification record;
5. traceability matrix diperbarui dari `local-verified` menjadi status yang
   dibuktikan evidence;
6. gap yang blocking ditutup atau mempunyai exception yang sah.

Sandbox hanya diperlukan apabila exact combination belum memiliki certification
aktif. `ci-qualified` tidak memberikan izin deployment.
