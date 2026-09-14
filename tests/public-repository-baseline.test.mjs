import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const baseline = JSON.parse(fs.readFileSync("docs/configuration/public-repository-baseline.json", "utf8"));

test("public baseline names every repository and stable required check", () => {
  assert.deepEqual(Object.keys(baseline.repositories).sort(), ["example-app-dotnet", "example-app-go", "example-app-laravel", "platform-runtime-images", "platform-workflow"]);
  for (const value of Object.values(baseline.repositories)) assert.match(value.requiredCheck, /\S/);
});

test("public baseline enforces review, history, and security controls", () => {
  assert.equal(baseline.repository.visibility, "public");
  assert.deepEqual(baseline.repository.mergeMethods, ["squash"]);
  assert.equal(baseline.repository.deleteHeadBranchOnMerge, true);
  assert.equal(baseline.repository.signedWebCommits, true);
  assert.equal(baseline.mainRuleset.protectedBranchDeletionAllowed, false);
  assert.equal(baseline.mainRuleset.forcePushAllowed, false);
  assert.equal(baseline.mainRuleset.approvals, 1);
  for (const enabled of ["codeOwnerReview", "dismissStaleReviews", "lastPushApproval", "conversationResolution", "strictRequiredChecks"]) assert.equal(baseline.mainRuleset[enabled], true);
  for (const enabled of Object.values(baseline.security)) assert.equal(enabled, true);
});

test("public baseline excludes internal execution and deployment credentials", () => {
  assert.equal(baseline.publicRunnerBoundary.allowedRunner, "ubuntu-24.04");
  assert.equal(baseline.publicRunnerBoundary.internalRunnerLabelsAllowed, false);
  assert.equal(baseline.publicRunnerBoundary.deploymentCredentialsAllowed, false);
});
