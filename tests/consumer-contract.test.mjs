import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parse} from "yaml";

test("thin caller uses an immutable workflow revision and no inherited secrets", () => {
  const caller = parse(fs.readFileSync("examples/thin-caller-php-laravel.yml", "utf8"));
  const job = caller.jobs["php-laravel-ci"];
  assert.match(job.uses, /^OXY7O\/platform-workflow\/.github\/workflows\/ci-profile-php-laravel\.yml@[a-f0-9]{40}$/);
  assert.equal(job.secrets, undefined);
  assert.deepEqual(job.permissions, {contents: "read"});
});

test("artifact handoff prohibits rebuild and deployment execution", () => {
  const handoff = JSON.parse(fs.readFileSync("contracts/artifact-handoff.json", "utf8"));
  assert.equal(handoff.requiredReadiness, "ci-qualified");
  assert.equal(handoff.sameDigestRequired, true);
  assert.equal(handoff.rebuildAllowed, false);
  assert.equal(handoff.deploymentExecutedHere, false);
});
