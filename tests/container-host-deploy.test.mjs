import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const script = path.resolve("scripts/container-host-deploy.sh");
const digest = `sha256:${"c".repeat(64)}`;
const image = `ghcr.io/oxy7o/example-app-laravel@${digest}`;

function run(extraEnv = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "container-host-deploy-test-"));
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  for (const command of ["ssh", "scp"]) fs.copyFileSync(`tests/fixtures/deployment/bin/${command}`, path.join(bin, command));
  fs.chmodSync(path.join(bin, "ssh"), 0o755);
  fs.chmodSync(path.join(bin, "scp"), 0o755);
  const result = spawnSync("bash", [script, image, "tests/fixtures/deployment/compose.yaml", "web", "60", "10", ""], {
    encoding: "utf8",
    env: {...process.env, PATH: `${bin}:${process.env.PATH}`, DEPLOY_SSH_PRIVATE_KEY: "PRIVATE_KEY", DEPLOY_KNOWN_HOSTS: "host ssh-ed25519 AAAA", DEPLOY_TARGET_HOST: "host", DEPLOY_TARGET_USER: "deploy", DEPLOY_ATTEMPT_ID: "DPA-20260913-0001", TEST_LOG: path.join(root, "argv.log"), ...extraEnv}
  });
  return {result, root, log: fs.existsSync(path.join(root, "argv.log")) ? fs.readFileSync(path.join(root, "argv.log"), "utf8") : ""};
}

test("deploys through the allowlisted remote wrapper and emits safe safe result", () => {
  const {result, log} = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(log, /platform-compose-deploy apply/);
  assert.match(log, new RegExp(digest));
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /PRIVATE_KEY|AAAA/);
  assert.match(result.stdout, /terminalStatus=succeeded/);
});

test("requires strict known hosts and always removes temporary credentials", () => {
  const {result, root} = run({DEPLOY_KNOWN_HOSTS: ""});
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /PRIVATE_KEY/);
  assert.equal(fs.readdirSync(root).some((name) => name.startsWith("platform-deploy.")), false);
});

test("rejects mutable images, unsafe services, and unsafe compose paths", () => {
  const source = fs.readFileSync(script, "utf8");
  assert.match(source, /@sha256:/);
  assert.match(source, /web\|queue\|scheduler/);
  assert.match(source, /realpath/);
  assert.doesNotMatch(source, /eval|StrictHostKeyChecking=no/);
});

test("preserves controlled failure and rollback output from executor", () => {
  const {result} = run({FAKE_SSH_RESULT: "terminalStatus=failed\nactiveDigest=\nhealthStatus=unhealthy\npreviousLkgDigest=sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd\nresultingLkgDigest=sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd\nrollbackStatus=succeeded\nfailureCategory=health", FAKE_SSH_EXIT: "20"});
  assert.equal(result.status, 20);
  assert.match(result.stdout, /rollbackStatus=succeeded/);
  assert.doesNotMatch(result.stdout, /host|deploy/);
});
