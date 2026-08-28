import test from "node:test";
import assert from "node:assert/strict";

test("required check failure determines readiness and category", async () => {
  const {normalizeResults} = await import("../lib/normalize-results.js");
  assert.deepEqual(normalizeResults([{id: "unit", required: true, status: "failed", failureCategory: "test", safeDiagnostic: "tests failed"}]), {readiness: "failed", failureCategory: "test"});
});

test("optional not-applicable check preserves passed readiness", async () => {
  const {normalizeResults} = await import("../lib/normalize-results.js");
  assert.deepEqual(normalizeResults([{id: "optional", required: false, status: "not-applicable", failureCategory: null, safeDiagnostic: null}]), {readiness: "passed", failureCategory: null});
});

test("required not-run is a platform failure", async () => {
  const {normalizeResults} = await import("../lib/normalize-results.js");
  assert.deepEqual(normalizeResults([{id: "unit", required: true, status: "not-run", failureCategory: null, safeDiagnostic: null}]), {readiness: "failed", failureCategory: "platform-internal"});
});
