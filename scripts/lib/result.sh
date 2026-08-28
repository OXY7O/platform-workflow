#!/usr/bin/env bash
set -euo pipefail

emit_result() {
  local id="$1" required="$2" status="$3" category="$4" diagnostic="$5"
  local category_json="null" diagnostic_json="null"
  [[ -n "$category" ]] && category_json="\"$category\""
  [[ -n "$diagnostic" ]] && diagnostic_json="\"$diagnostic\""
  local line
  line="{\"id\":\"$id\",\"required\":$required,\"status\":\"$status\",\"failureCategory\":$category_json,\"safeDiagnostic\":$diagnostic_json}"
  printf '%s\n' "$line"
  if [[ -n "${RUNNER_TEMP:-}" ]]; then
    mkdir -p "$RUNNER_TEMP/platform-results"
    printf '%s\n' "$line" >> "$RUNNER_TEMP/platform-results/checks.jsonl"
  fi
}
