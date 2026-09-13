import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

const workflowPath = ".github/workflows/build-oci-php-laravel.yml";
const load = () => parse(fs.readFileSync(workflowPath, "utf8"));

test("OCI publication is a callable self-hosted workflow with explicit permissions", () => {
  const workflow = load();
  assert.ok(workflow.on.workflow_call);
  assert.deepEqual(workflow.permissions, {contents: "read"});
  assert.deepEqual(workflow.jobs.publish["runs-on"], ["self-hosted", "platform-ci"]);
  assert.deepEqual(workflow.jobs.publish.permissions, {
    contents: "read",
    packages: "write",
    "id-token": "write",
    attestations: "write"
  });
});

test("OCI publication exposes immutable artifact and evidence outputs", () => {
  const workflow = load();
  for (const name of ["image-reference", "image-digest", "artifact-id", "source-sha", "provenance-reference", "sbom-reference", "evidence-metadata"]) {
    assert.ok(workflow.on.workflow_call.outputs[name], name);
  }
});

test("OCI publication validates its caller and builds without deployment", () => {
  const workflow = load();
  const steps = workflow.jobs.publish.steps;
  assert.ok(steps.some((step) => step.uses?.startsWith("OXY7O/platform-workflow/actions/validate-oci-build@")));
  assert.ok(steps.some((step) => step.uses?.startsWith("docker/build-push-action@") && step.with.push === true));
  assert.ok(steps.some((step) => step.uses?.startsWith("actions/attest-build-provenance@")));
  assert.equal(Object.keys(workflow.jobs).some((name) => name.includes("deploy")), false);
  assert.equal(JSON.stringify(workflow).includes("secrets: inherit"), false);
});

test("OCI publication repairs persistent self-hosted workspace ownership before checkout", () => {
  const workflow = load();
  const [prepare, checkout] = workflow.jobs.publish.steps;

  assert.equal(prepare.name, "Prepare reusable runner workspace");
  assert.match(prepare.run, /docker run --rm/);
  assert.match(prepare.run, /chown -R/);
  assert.doesNotMatch(prepare.run, /sudo/);
  assert.match(checkout.uses, /^actions\/checkout@/);
});

test("OCI publication pins every external action to a full commit SHA", () => {
  const workflow = load();
  for (const step of workflow.jobs.publish.steps) {
    if (!step.uses) continue;
    assert.match(step.uses, /^[^@]+@[a-f0-9]{40}$/, step.uses);
  }
});

test("OCI publication does not expose arbitrary commands or deployment secrets", () => {
  const source = fs.readFileSync(workflowPath, "utf8");
  assert.doesNotMatch(source, /build-command|build-args|ssh|kubeconfig|DEPLOY_/i);
  assert.doesNotMatch(source, /pull_request_target/);
});
