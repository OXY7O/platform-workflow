# Handoff Artifact

Workflow menghasilkan `application-package` dan manifest dengan identitas source SHA, workflow SHA, contract digest, artifact digest, serta manifest digest. Sistem deployment berikutnya wajib menggunakan artifact dengan digest yang sama dan tidak boleh membangun ulang source.

Syarat handoff: readiness `ci-qualified`; artifact dan manifest tersedia; digest tervalidasi; evidence aman direferensikan; promosi mempertahankan artifact yang sama; dan deployment dijalankan oleh workflow terpisah. Kontrak machine-readable tersedia di [artifact-handoff.json](../contracts/artifact-handoff.json).
