# Baseline Repository Publik

Dokumen ini merekam desired state repository publik OXY7O. Sumber
machine-readable tersedia pada [`public-repository-baseline.json`](public-repository-baseline.json).

Semua repository memakai `main`, squash merge, automatic head-branch deletion,
signed web commits, dan auto-merge. Ruleset melarang penghapusan protected branch,
force push, serta merge tanpa review CODEOWNERS, approval last pusher, penyelesaian
conversation, linear history, dan required check yang mutakhir.

Secret scanning, push protection, Dependabot security updates, CodeQL default
setup, dan private vulnerability reporting wajib aktif. Repository publik hanya
boleh memakai `ubuntu-24.04`; runner internal dan credential deployment tidak
boleh tersedia.

Review requirement sengaja tidak mempunyai bypass actor. Bila author adalah
satu-satunya operator aktif, PR tetap menunggu reviewer independen alih-alih
mengurangi kontrol.
