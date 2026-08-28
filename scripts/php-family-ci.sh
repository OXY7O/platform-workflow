#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/result.sh"

working_directory="${1:-}"
dependency_mode="${2:-}"
if [[ -z "$working_directory" || "$working_directory" = /* || "$working_directory" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid working directory"; exit 2
fi
if [[ "$dependency_mode" != "composer-frozen" ]]; then
  emit_result composer-lock true failed contract "unknown dependency preset"; exit 2
fi
if [[ ! -f "$working_directory/composer.json" ]]; then
  emit_result composer-lock true failed dependency "composer manifest missing"; exit 1
fi
if [[ ! -f "$working_directory/composer.lock" ]]; then
  emit_result composer-lock true failed dependency "composer lock missing"; exit 1
fi

before="$(shasum -a 256 "$working_directory/composer.lock" | awk '{print $1}')"
(
  cd "$working_directory"
  composer install --no-interaction --no-progress --prefer-dist
)
after="$(shasum -a 256 "$working_directory/composer.lock" | awk '{print $1}')"
if [[ "$before" != "$after" ]]; then
  emit_result composer-lock true failed dependency "composer lock changed"; exit 1
fi
emit_result composer-lock true passed "" ""
