#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib/result.sh
source "$(dirname "$0")/lib/result.sh"

solution_path="${1:-}"
project_path="${2:-}"
test_project_path="${3:-}"
sdk_version="${4:-}"
coverage_threshold="${5:-}"

valid_relative_file() {
  [[ -n "$1" && "$1" != /* && ! "$1" =~ (^|/)\.\.(/|$) && -f "$1" && ! -L "$1" ]]
}

for candidate in "$solution_path" "$project_path" "$test_project_path"; do
  if ! valid_relative_file "$candidate"; then
    emit_result contract true failed contract "invalid or missing source path"; exit 2
  fi
done
if [[ "$sdk_version" != "10.0.110" && "$sdk_version" != "11.0.100-preview.6.26359.118" ]]; then
  emit_result contract true failed contract "unsupported .NET SDK"; exit 2
fi
if [[ ! "$coverage_threshold" =~ ^([0-9]|[1-9][0-9]|100)$ ]]; then
  emit_result coverage true failed contract "invalid coverage threshold"; exit 2
fi

repository_root="$(pwd -P)"
for candidate in "$solution_path" "$project_path" "$test_project_path"; do
  resolved="$(cd "$(dirname "$candidate")" && pwd -P)/$(basename "$candidate")"
  if [[ "$resolved" != "$repository_root"/* ]]; then
    emit_result contract true failed contract "source path escapes repository"; exit 2
  fi
done

for lock_file in "$(dirname "$project_path")/packages.lock.json" "$(dirname "$test_project_path")/packages.lock.json"; do
  if [[ ! -f "$lock_file" || -L "$lock_file" ]]; then
    emit_result dependency-lock true failed dependency "packages.lock.json missing"; exit 1
  fi
done

if [[ "$(dotnet --version)" != "$sdk_version" ]]; then
  emit_result runtime true failed configuration "unexpected .NET SDK"; exit 1
fi
if ! dotnet restore "$solution_path" --locked-mode; then
  emit_result restore true failed dependency "locked restore failed"; exit 1
fi
if ! dotnet format "$solution_path" --verify-no-changes --no-restore; then
  emit_result format true failed quality "format verification failed"; exit 1
fi
if ! dotnet build "$solution_path" --configuration Release --no-restore; then
  emit_result build true failed configuration "Release build failed"; exit 1
fi

temporary_root="${RUNNER_TEMP:?RUNNER_TEMP is required}"
mkdir -p "$temporary_root"
coverage_root="$temporary_root/dotnet-coverage-$$"
vulnerable_json="$temporary_root/dotnet-vulnerable-$$.json"
deprecated_json="$temporary_root/dotnet-deprecated-$$.json"
trap 'rm -rf "$coverage_root"; rm -f "$vulnerable_json" "$deprecated_json"' EXIT

if ! dotnet test "$test_project_path" --configuration Release --no-build --no-restore --collect "XPlat Code Coverage" --results-directory "$coverage_root"; then
  emit_result test true failed test "test execution failed"; exit 1
fi
coverage_file="$(find "$coverage_root" -type f -name coverage.cobertura.xml -print -quit)"
if [[ -z "$coverage_file" ]]; then
  emit_result coverage true failed quality "machine-readable coverage missing"; exit 1
fi
coverage="$(node -e 'const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");const m=s.match(/line-rate="([0-9.]+)"/);if(!m)process.exit(2);process.stdout.write(String(Math.floor(Number(m[1])*100)))' "$coverage_file")" || {
  emit_result coverage true failed quality "invalid coverage report"; exit 1
}
if [[ "$coverage" -lt "$coverage_threshold" ]]; then
  emit_result coverage true failed quality "coverage below threshold"; exit 1
fi

if ! dotnet package list --project "$project_path" --vulnerable --include-transitive --format json --no-restore > "$vulnerable_json"; then
  emit_result vulnerability true failed security "vulnerability query failed"; exit 1
fi
if ! node -e 'const x=require(process.argv[1]);for(const p of x.projects??[])for(const f of p.frameworks??[])if((f.topLevelPackages??[]).length||(f.transitivePackages??[]).length)process.exit(1)' "$vulnerable_json"; then
  emit_result vulnerability true failed security "vulnerable dependency found"; exit 1
fi
if ! dotnet package list --project "$project_path" --deprecated --include-transitive --format json --no-restore > "$deprecated_json"; then
  emit_result deprecated true failed dependency "deprecated package query failed"; exit 1
fi
if ! node -e 'const x=require(process.argv[1]);for(const p of x.projects??[])for(const f of p.frameworks??[])if((f.topLevelPackages??[]).length||(f.transitivePackages??[]).length)process.exit(1)' "$deprecated_json"; then
  emit_result deprecated true failed dependency "deprecated dependency found"; exit 1
fi

emit_result dotnet-family true passed "" ""
