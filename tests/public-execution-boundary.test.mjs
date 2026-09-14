import test from "node:test";
import assert from "node:assert/strict";
import {validateWorkflow} from "../scripts/validate-public-execution-boundary.mjs";

test("rejects internal runners", () => {
  const violations = validateWorkflow({
    jobs: {build: {"runs-on": ["self-hosted", "platform-ci"]}}
  });

  assert.match(violations.join("\n"), /internal runner label/);
});

test("rejects privileged fork execution", () => {
  const violations = validateWorkflow({
    on: {pull_request_target: {}},
    jobs: {build: {"runs-on": "ubuntu-24.04"}}
  });

  assert.match(violations.join("\n"), /pull_request_target/);
});

test("rejects inherited secrets and deployment identifiers", () => {
  const violations = validateWorkflow({
    jobs: {
      deploy: {
        uses: "OXY7O/platform-workflow/.github/workflows/deploy.yml@0123456789012345678901234567890123456789",
        secrets: "inherit",
        with: {target_host: "internal.example"}
      }
    }
  });

  assert.match(violations.join("\n"), /secret inheritance/);
  assert.match(violations.join("\n"), /internal deployment field/);
});

test("rejects unpinned reusable workflows", () => {
  const violations = validateWorkflow({
    jobs: {build: {uses: "OXY7O/platform-workflow/.github/workflows/ci.yml@main"}}
  });

  assert.match(violations.join("\n"), /full commit SHA/);
});

test("accepts GitHub-hosted read-only CI", () => {
  const violations = validateWorkflow({
    on: {pull_request: {}},
    permissions: {contents: "read"},
    jobs: {build: {"runs-on": "ubuntu-24.04", steps: []}}
  });

  assert.deepEqual(violations, []);
});

test("accepts an immutable reusable public workflow", () => {
  const violations = validateWorkflow({
    permissions: {contents: "read"},
    jobs: {
      build: {
        uses: "OXY7O/platform-workflow/.github/workflows/ci.yml@0123456789012345678901234567890123456789"
      }
    }
  });

  assert.deepEqual(violations, []);
});
