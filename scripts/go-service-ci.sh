#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib/result.sh
source "$(dirname "$0")/lib/result.sh"

working_directory="${1:-}"
main_package="${2:-}"
binary_output="${3:-}"

if [[ -z "$working_directory" || "$working_directory" = /* || "$working_directory" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid working directory"; exit 2
fi
if [[ ! "$main_package" =~ ^\./([A-Za-z0-9._/-]+)?$ || "$main_package" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid main package"; exit 2
fi
if [[ -z "$binary_output" || "$binary_output" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid binary output"; exit 2
fi

repository_root="$(pwd -P)"
resolved_working="$(cd "$working_directory" && pwd -P)"
if [[ "$resolved_working" != "$repository_root" && "$resolved_working" != "$repository_root"/* ]]; then
  emit_result contract true failed contract "working directory escapes repository"; exit 2
fi

if [[ "$binary_output" = /* ]]; then
  mkdir -p "$(dirname "$binary_output")"
  resolved_output="$(cd "$(dirname "$binary_output")" && pwd -P)/$(basename "$binary_output")"
  runner_root="$(cd "${RUNNER_TEMP:?RUNNER_TEMP is required for absolute output}" && pwd -P)"
  if [[ "$resolved_output" != "$runner_root"/* ]]; then
    emit_result contract true failed contract "binary output escapes runner temp"; exit 2
  fi
else
  mkdir -p "$(dirname "$binary_output")"
  resolved_output="$repository_root/$binary_output"
fi

if ! (cd "$resolved_working" && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -buildvcs=false -o "$resolved_output" "$main_package"); then
  emit_result build true failed configuration "Go Service build failed"; exit 1
fi
if [[ ! -f "$resolved_output" || -L "$resolved_output" || ! -x "$resolved_output" ]]; then
  emit_result build true failed artifact "binary output is invalid"; exit 1
fi

emit_result go-service-build true passed "" ""
