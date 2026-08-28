#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/result.sh"

working_directory="${1:-}"
test_profile="${2:-}"
coverage_threshold="${3:-}"
if [[ -z "$working_directory" || "$working_directory" = /* || "$working_directory" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid working directory"; exit 2
fi
case "$test_profile" in
  phpunit|pest) ;;
  *) emit_result unit-test true failed contract "unknown test preset"; exit 2 ;;
esac
if [[ ! "$coverage_threshold" =~ ^([0-9]|[1-9][0-9]|100)$ ]]; then
  emit_result coverage true failed contract "invalid coverage threshold"; exit 2
fi
for marker in artisan bootstrap/app.php composer.json composer.lock; do
  if [[ ! -e "$working_directory/$marker" ]]; then
    emit_result configuration true failed configuration "Laravel structure marker missing"; exit 1
  fi
done
if ! (cd "$working_directory" && composer run --no-interaction "test:$test_profile"); then
  emit_result unit-test true failed test "application tests failed"; exit 1
fi
emit_result unit-test true passed "" ""
