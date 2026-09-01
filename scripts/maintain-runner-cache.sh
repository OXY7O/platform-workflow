#!/usr/bin/env bash
set -euo pipefail

# Jalankan pada host runner platform-ci melalui jadwal operator. Image dipin
# berdasarkan digest agar warmup tidak mengubah runtime yang telah disetujui.
readonly approved_images=(
  "php:8.2-cli-bookworm@sha256:6ca4b01d84082465358c5d541a2bef0edd9d0be494802aeb40f2d7c7a8d73adb"
  "php:8.3-cli-bookworm@sha256:177529735599a8244b2c903522f029839dce1c2ac4be122fdc00ada4b45a20e4"
  "php:8.4-cli-bookworm@sha256:9cc9310a457019cd6b682109eb3c5dd8bf73498e7d3b9ee5c33d0d0b83d0faf3"
  "php:8.5-cli-bookworm@sha256:b80dfc7d2bc0fc97755620a0dfb3d5e8e9cbf70a2970ea2d5c9dc64154b31422"
  "node:24-bookworm@sha256:be23f54a88d34e8824c741b19b91064094f92c1c97b194144bfc8b50d67258e2"
)

for image in "${approved_images[@]}"; do
  docker pull "${image}"
done

# Hanya layer dangling dan build cache lama yang dibersihkan. Named volume
# Composer/npm tidak disentuh dan image approved di-warm kembali di atas.
docker image prune --force --filter "until=168h"
docker builder prune --force --filter "until=168h" --keep-storage "10GB"

docker system df
