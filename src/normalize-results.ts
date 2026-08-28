import type {CheckResult, FailureCategory, Readiness} from "./contracts/types.js";

export interface NormalizedResult {
  readiness: Readiness;
  failureCategory: FailureCategory | null;
}

export function normalizeResults(results: CheckResult[]): NormalizedResult {
  const failed = results.find((result) => result.required && result.status === "failed");
  if (failed) return {readiness: "failed", failureCategory: failed.failureCategory ?? "platform-internal"};
  const notRun = results.find((result) => result.required && result.status === "not-run");
  if (notRun) return {readiness: "failed", failureCategory: "platform-internal"};
  return {readiness: "passed", failureCategory: null};
}
