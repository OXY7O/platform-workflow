#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib/result.sh
source "$(dirname "$0")/lib/result.sh"

project_path="${1:-}"
target_framework="${2:-}"
runtime_identifier="${3:-}"
publish_directory="${4:-}"

if [[ -z "$project_path" || "$project_path" = /* || "$project_path" =~ (^|/)\.\.(/|$) || ! -f "$project_path" || -L "$project_path" ]]; then
  emit_result contract true failed contract "invalid project path"; exit 2
fi
if [[ "$target_framework" != "net10.0" || "$runtime_identifier" != "linux-x64" ]]; then
  emit_result profile true failed configuration "unsupported target framework or runtime"; exit 1
fi
if [[ -z "$publish_directory" || "$publish_directory" =~ (^|/)\.\.(/|$) ]]; then
  emit_result contract true failed contract "invalid publish directory"; exit 2
fi

repository_root="$(pwd -P)"
resolved_project="$(cd "$(dirname "$project_path")" && pwd -P)/$(basename "$project_path")"
if [[ "$resolved_project" != "$repository_root"/* ]]; then
  emit_result contract true failed contract "project path escapes repository"; exit 2
fi
project_source="$(<"$resolved_project")"
if [[ "$project_source" != *'Sdk="Microsoft.NET.Sdk.Web"'* || "$project_source" != *'<TargetFramework>net10.0</TargetFramework>'* ]]; then
  emit_result profile true failed configuration "project is not the governed net10.0 Web SDK profile"; exit 1
fi

runner_root="$(cd "${RUNNER_TEMP:?RUNNER_TEMP is required}" && pwd -P)"
if [[ "$publish_directory" != /* ]]; then
  emit_result contract true failed contract "publish directory must be an absolute RUNNER_TEMP path"; exit 2
fi
mkdir -p "$(dirname "$publish_directory")"
resolved_output="$(cd "$(dirname "$publish_directory")" && pwd -P)/$(basename "$publish_directory")"
if [[ "$resolved_output" != "$runner_root"/* || -L "$publish_directory" ]]; then
  emit_result contract true failed contract "publish directory escapes runner temp"; exit 2
fi
mkdir -p "$publish_directory"

if ! dotnet publish "$project_path" --configuration Release --no-build --no-restore --framework net10.0 --runtime linux-x64 --self-contained false --output "$publish_directory"; then
  emit_result publish true failed artifact "framework-dependent publish failed"; exit 1
fi
if [[ -L "$publish_directory" || -z "$(find "$publish_directory" -type f -print -quit)" ]]; then
  emit_result publish true failed artifact "publish output is empty or unsafe"; exit 1
fi
if find "$publish_directory" \( -type l -o -type f \( -name '*.cs' -o -name '*.csproj' -o -name '*Tests*' -o -name 'coverage.*' -o -name 'coreclr' -o -name 'libcoreclr.so' \) \) -print -quit | grep -q .; then
  emit_result publish true failed artifact "publish output contains prohibited content"; exit 1
fi

emit_result dotnet-webapi-publish true passed "" ""
