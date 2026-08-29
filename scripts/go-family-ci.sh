#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib/result.sh
source "$(dirname "$0")/lib/result.sh"

working_directory="${1:-}"
go_version="${2:-}"
coverage_threshold="${3:-}"

if [[ -z "$working_directory" || "$working_directory" = /* || "$working_directory" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid working directory"; exit 2
fi
if [[ ! "$go_version" =~ ^1\.(26\.7|27\.0)$ ]]; then
  emit_result contract true failed contract "unsupported Go version"; exit 2
fi
if [[ ! "$coverage_threshold" =~ ^([0-9]|[1-9][0-9]|100)$ ]]; then
  emit_result coverage true failed contract "invalid coverage threshold"; exit 2
fi
for marker in go.mod go.sum; do
  if [[ ! -f "$working_directory/$marker" ]]; then
    emit_result go-modules true failed dependency "$marker missing"; exit 1
  fi
done

actual_version="$(go version | awk '{print $3}' | sed 's/^go//')"
if [[ "$actual_version" != "$go_version" ]]; then
  emit_result runtime true failed configuration "unexpected Go runtime"; exit 1
fi

before_mod="$(shasum -a 256 "$working_directory/go.mod" | awk '{print $1}')"
before_sum="$(shasum -a 256 "$working_directory/go.sum" | awk '{print $1}')"
if ! (cd "$working_directory" && go mod verify && go mod tidy); then
  emit_result go-modules true failed dependency "module verification failed"; exit 1
fi
after_mod="$(shasum -a 256 "$working_directory/go.mod" | awk '{print $1}')"
after_sum="$(shasum -a 256 "$working_directory/go.sum" | awk '{print $1}')"
if [[ "$before_mod" != "$after_mod" || "$before_sum" != "$after_sum" ]]; then
  emit_result go-modules true failed dependency "module graph changed"; exit 1
fi

unformatted="$(find "$working_directory" -type f -name '*.go' -not -path '*/vendor/*' -print0 | xargs -0 gofmt -l)"
if [[ -n "$unformatted" ]]; then
  emit_result format true failed quality "Go source is not formatted"; exit 1
fi
if ! (cd "$working_directory" && go vet ./...); then
  emit_result vet true failed quality "go vet failed"; exit 1
fi
if ! (cd "$working_directory" && go test ./...); then
  emit_result unit-test true failed test "unit tests failed"; exit 1
fi
if ! (cd "$working_directory" && go test -race ./...); then
  emit_result race-test true failed test "race tests failed"; exit 1
fi

temporary_root="${RUNNER_TEMP:-/tmp}"
mkdir -p "$temporary_root"
coverage_file="$temporary_root/go-coverage-$$.out"
trap 'rm -f "$coverage_file"' EXIT
if ! (cd "$working_directory" && go test -coverprofile="$coverage_file" ./...); then
  emit_result coverage true failed test "coverage run failed"; exit 1
fi
coverage="$(go tool cover -func="$coverage_file" | awk '/^total:/ {gsub(/%/, "", $3); print int($3)}')"
if [[ -z "$coverage" || "$coverage" -lt "$coverage_threshold" ]]; then
  emit_result coverage true failed quality "coverage below threshold"; exit 1
fi
if ! (cd "$working_directory" && go tool govulncheck ./...); then
  emit_result vulnerability true failed security "vulnerability check failed"; exit 1
fi

emit_result go-family true passed "" ""
