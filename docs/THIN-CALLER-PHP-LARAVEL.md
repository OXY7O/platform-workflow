# Thin Caller PHP Laravel

Thin caller hanya memilih parameter yang diizinkan. Urutan pemeriksaan, command, taxonomy, dan proses packaging tetap dimiliki platform workflow.

Gunakan [contoh caller](../examples/thin-caller-php-laravel.yml), kemudian tetapkan versi PHP, test profile (`phpunit` atau `pest`), working directory relatif, coverage 0–100, retention 1–30 hari, serta extension dari allowlist schema.

Caller wajib memakai full commit SHA. Tag membantu discovery release, tetapi tidak menggantikan pin immutable. Jangan tambahkan arbitrary command atau `secrets: inherit`. Output `ci-qualified` hanya menyatakan artifact lolos kontrak CI; output itu bukan izin deployment.
