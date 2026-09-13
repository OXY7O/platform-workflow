import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {ContainerHostDeploymentInput} from "./contracts/deployment-types.js";

const schema = JSON.parse(fs.readFileSync(new URL("../contracts/container-host-deployment.schema.json", import.meta.url), "utf8"));
const Ajv2020 = AjvModule.default;
const ajv = new Ajv2020({allErrors: true, strict: true});
const validate = ajv.compile(schema);

function safeErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`).join("; ");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function validateContainerHostDeployment(input: unknown): ContainerHostDeploymentInput {
  if (!validate(input)) throw new Error(`Container-host deployment contract invalid: ${safeErrors(validate.errors)}`);
  const resolved = structuredClone(input) as ContainerHostDeploymentInput;
  if (!resolved.imageReference.endsWith(`@${resolved.imageDigest}`)) {
    throw new Error("Container-host deployment contract invalid: /imageReference must resolve to /imageDigest");
  }
  return resolved;
}

export function calculateContainerHostDeploymentDigest(input: unknown): string {
  const valid = validateContainerHostDeployment(input);
  return `sha256:${createHash("sha256").update(canonical(valid)).digest("hex")}`;
}
