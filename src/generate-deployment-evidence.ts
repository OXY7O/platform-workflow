import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

export interface DeploymentEvidenceInput {
  attemptId: string; repository: string; environment: "development"; targetId: "laravel-development-container-host";
  sourceSha: string; workflowSha: string; artifactId: string; imageDigest: string; authorizationReference: string;
  startedAt: string; completedAt: string; terminalStatus: "succeeded" | "failed";
  failureCategory: null | "authorization" | "contract" | "pull" | "compose" | "health" | "rollback" | "platform";
  healthStatus: "healthy" | "unhealthy" | "not-run"; previousLkgDigest: string | null; resultingLkgDigest: string | null;
  rollbackStatus: "not-required" | "succeeded" | "failed" | "unavailable"; governanceVersion: "v1.5.0"; contractDigest: string;
}

const schema = JSON.parse(fs.readFileSync(new URL("../contracts/deployment-result.schema.json", import.meta.url), "utf8"));
const Ajv2020 = AjvModule.default;
const ajv = new Ajv2020({allErrors: true, strict: true});
addFormatsModule.default(ajv);
const validate = ajv.compile(schema);
function safeErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`).join("; ");
}

export function generateDeploymentEvidence(input: unknown): DeploymentEvidenceInput {
  if (!validate(input)) throw new Error(`Deployment evidence invalid: ${safeErrors(validate.errors)}`);
  const value = input as DeploymentEvidenceInput;
  if (new Date(value.completedAt).getTime() < new Date(value.startedAt).getTime()) throw new Error("Deployment evidence invalid: /completedAt must not precede /startedAt");
  if (value.terminalStatus === "succeeded" && value.failureCategory !== null) throw new Error("Deployment evidence invalid: /failureCategory must be null for succeeded status");
  if (value.terminalStatus === "failed" && value.failureCategory === null) throw new Error("Deployment evidence invalid: /failureCategory is required for failed status");
  return {
    attemptId: value.attemptId, repository: value.repository, environment: value.environment, targetId: value.targetId,
    sourceSha: value.sourceSha, workflowSha: value.workflowSha, artifactId: value.artifactId, imageDigest: value.imageDigest,
    authorizationReference: value.authorizationReference, startedAt: value.startedAt, completedAt: value.completedAt,
    terminalStatus: value.terminalStatus, failureCategory: value.failureCategory, healthStatus: value.healthStatus,
    previousLkgDigest: value.previousLkgDigest, resultingLkgDigest: value.resultingLkgDigest,
    rollbackStatus: value.rollbackStatus, governanceVersion: value.governanceVersion, contractDigest: value.contractDigest
  };
}
