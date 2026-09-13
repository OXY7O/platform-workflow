#!/usr/bin/env bash
set -Eeuo pipefail

image_reference=${1:-}
compose_path=${2:-}
services_csv=${3:-}
health_timeout=${4:-}
health_retries=${5:-}
lkg_digest=${6:-}

for required_name in DEPLOY_SSH_PRIVATE_KEY DEPLOY_KNOWN_HOSTS DEPLOY_TARGET_HOST DEPLOY_TARGET_USER DEPLOY_ATTEMPT_ID; do
  [[ -n "${!required_name:-}" ]] || { printf 'deployment configuration missing: %s\n' "$required_name" >&2; exit 2; }
done
[[ "$image_reference" =~ ^[a-z0-9.-]+(:[0-9]+)?/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]] || { printf 'immutable image reference required\n' >&2; exit 2; }
[[ "$health_timeout" =~ ^[0-9]+$ && "$health_timeout" -ge 10 && "$health_timeout" -le 300 ]] || exit 2
[[ "$health_retries" =~ ^[0-9]+$ && "$health_retries" -ge 1 && "$health_retries" -le 30 ]] || exit 2
IFS=',' read -r -a services <<< "$services_csv"
for service in "${services[@]}"; do [[ "$service" =~ ^(web|queue|scheduler)$ ]] || { printf 'unsupported service\n' >&2; exit 2; }; done

repo_root=$(pwd -P)
compose_real=$(realpath "$compose_path")
[[ "$compose_real" == "$repo_root"/* ]] || { printf 'compose path must remain in repository\n' >&2; exit 2; }

temporary_dir=$(mktemp -d "${TMPDIR:-/tmp}/platform-deploy.XXXXXX")
cleanup() { chmod -R u+w "$temporary_dir" 2>/dev/null || true; rm -rf -- "$temporary_dir"; }
trap cleanup EXIT
key_file="$temporary_dir/id_deploy"
known_hosts_file="$temporary_dir/known_hosts"
printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" > "$key_file"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$known_hosts_file"
chmod 600 "$key_file" "$known_hosts_file"

ssh_options=(-i "$key_file" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$known_hosts_file")
remote_compose="/tmp/${DEPLOY_ATTEMPT_ID}.compose.yaml"
scp "${ssh_options[@]}" "$compose_real" "${DEPLOY_TARGET_USER}@${DEPLOY_TARGET_HOST}:$remote_compose" >/dev/null

set +e
remote_result=$(ssh "${ssh_options[@]}" "${DEPLOY_TARGET_USER}@${DEPLOY_TARGET_HOST}" platform-compose-deploy apply \
  --attempt-id "$DEPLOY_ATTEMPT_ID" --compose "$remote_compose" --image "$image_reference" \
  --services "$services_csv" --health-path /up --health-timeout "$health_timeout" \
  --health-retries "$health_retries" --lkg-digest "$lkg_digest")
remote_status=$?
set -e

while IFS= read -r line; do
  [[ "$line" =~ ^(terminalStatus|activeDigest|healthStatus|previousLkgDigest|resultingLkgDigest|rollbackStatus|failureCategory)=([A-Za-z0-9:._-]*)$ ]] || continue
  printf '%s\n' "$line"
done <<< "$remote_result"
exit "$remote_status"
