#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib/result.sh
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

if find "$working_directory" \
  -type d \( -name .git -o -name vendor -o -name node_modules \) -prune -o \
  -type f \( -name .env -o -name '.env.*' \) ! -name .env.example -print -quit | grep -q .; then
  emit_result sensitive-material-guard true failed security "prohibited environment file detected"; exit 1
fi
if grep -RIlE \
  --exclude-dir=.git --exclude-dir=vendor --exclude-dir=node_modules \
  -- '-----BEGIN ([A-Z0-9 ]+ )?PRIVATE KEY-----' "$working_directory" | grep -q .; then
  emit_result sensitive-material-guard true failed security "private key material detected"; exit 1
fi
emit_result sensitive-material-guard true passed "" ""

syntax_failed=false
while IFS= read -r -d '' source_file; do
  if ! php -l "$source_file" >/dev/null; then
    syntax_failed=true
    break
  fi
done < <(find "$working_directory" \
  -type d \( -name .git -o -name vendor -o -name node_modules \) -prune -o \
  -type f -name '*.php' -print0)
if [[ "$syntax_failed" == true ]]; then
  emit_result php-syntax true failed quality "PHP syntax validation failed"; exit 1
fi
emit_result php-syntax true passed "" ""

before="$(shasum -a 256 "$working_directory/composer.lock" | awk '{print $1}')"
if ! (
  cd "$working_directory"
  composer validate --strict --no-check-publish
  composer install --no-interaction --no-progress --prefer-dist
); then
  emit_result composer-lock true failed dependency "Composer validation or frozen install failed"; exit 1
fi
after="$(shasum -a 256 "$working_directory/composer.lock" | awk '{print $1}')"
if [[ "$before" != "$after" ]]; then
  emit_result composer-lock true failed dependency "composer lock changed"; exit 1
fi
emit_result composer-lock true passed "" ""

if ! (cd "$working_directory" && composer audit --locked --no-interaction --no-ansi); then
  emit_result dependency-audit true failed security "Composer dependency audit failed"; exit 1
fi
emit_result dependency-audit true passed "" ""
