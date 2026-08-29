import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parse } from "yaml";

const actions = [
  {
    path: "actions/php-family-check/action.yml",
    command: /scripts\/php-family-ci\.sh/,
    inputs: ["working-directory", "dependency-mode"],
  },
  {
    path: "actions/laravel-profile-check/action.yml",
    command: /scripts\/laravel-profile-ci\.sh/,
    inputs: ["working-directory", "test-profile", "coverage-threshold"],
  },
];

test("private reusable checks execute bundled scripts from action_path", () => {
  for (const action of actions) {
    const manifest = parse(fs.readFileSync(action.path, "utf8"));
    assert.equal(manifest.runs.using, "composite", action.path);
    const source = JSON.stringify(manifest.runs.steps);
    assert.match(source, /GITHUB_ACTION_PATH/, action.path);
    assert.match(source, action.command, action.path);
    for (const input of action.inputs) assert.ok(manifest.inputs[input], `${action.path}: ${input}`);
  }
});
