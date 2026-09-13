import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

const file = ".github/workflows/deploy-container-host-development.yml";
const load = () => parse(fs.readFileSync(file, "utf8"));

test("development deployment is callable, serialized, and least privileged", () => {
  const workflow = load();
  assert.ok(workflow.on.workflow_call);
  assert.deepEqual(workflow.permissions, {contents: "read", packages: "read"});
  assert.equal(workflow.jobs.deploy.environment, "development");
  assert.deepEqual(workflow.jobs.deploy["runs-on"], ["self-hosted", "platform-ci"]);
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  assert.match(workflow.concurrency.group, /repository.*development/i);
});

test("development deployment repairs persistent self-hosted workspace ownership before checkout", () => {
  const workflow = load();
  const [prepare, checkout] = workflow.jobs.deploy.steps;

  assert.equal(prepare.name, "Prepare reusable runner workspace");
  assert.match(prepare.run, /docker run --rm/);
  assert.match(prepare.run, /chown -R/);
  assert.doesNotMatch(prepare.run, /sudo/);
  assert.match(checkout.uses, /^actions\/checkout@/);
});

test("workflow explicitly maps environment secrets and never inherits them", () => {
  const source = fs.readFileSync(file, "utf8");
  for (const name of ["DEPLOY_SSH_PRIVATE_KEY", "DEPLOY_KNOWN_HOSTS", "DEPLOY_TARGET_HOST", "DEPLOY_TARGET_USER", "REGISTRY_PULL_TOKEN"]) assert.match(source, new RegExp(name));
  assert.doesNotMatch(source, /secrets:\s*inherit/);
  assert.doesNotMatch(source, /production|staging|pull_request_target/i);
});

test("validation precedes execution and safe evidence runs on every outcome", () => {
  const workflow = load();
  const steps = workflow.jobs.deploy.steps;
  const validation = steps.findIndex((step) => step.uses?.includes("validate-container-host-deployment"));
  const execution = steps.findIndex((step) => step.uses?.includes("/actions/container-host-deploy@"));
  const evidence = steps.findIndex((step) => step.uses?.includes("generate-deployment-evidence"));
  assert.ok(validation >= 0 && execution > validation && evidence > execution);
  assert.equal(steps[evidence].if, "always()");
  assert.ok(steps.some((step) => step.uses?.startsWith("actions/upload-artifact@") && step.if === "always()"));
});

test("all actions are pinned and workflow exposes controlled outputs", () => {
  const workflow = load();
  for (const step of workflow.jobs.deploy.steps) if (step.uses) assert.match(step.uses, /^[^@]+@[0-9a-f]{40}$/);
  for (const name of ["deployment-attempt-id", "terminal-status", "active-digest", "rollback-status", "evidence-metadata"]) assert.ok(workflow.on.workflow_call.outputs[name], name);
});

test("actionlint recognizes the approved self-hosted runner label", () => {
  const config = fs.readFileSync(".github/actionlint.yaml", "utf8");
  assert.match(config, /self-hosted-runner:/);
  assert.match(config, /- platform-ci/);
});
