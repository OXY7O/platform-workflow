import {createHash} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {OciBuildInput} from "./contracts/types.js";

const schema = JSON.parse(fs.readFileSync(new URL("../contracts/oci-build-input.schema.json", import.meta.url), "utf8"));
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

function isWithinContext(contextPath: string, dockerfilePath: string): boolean {
  if (contextPath === ".") return true;
  const context = path.posix.normalize(contextPath).replace(/\/$/, "");
  const dockerfile = path.posix.normalize(dockerfilePath);
  return dockerfile === context || dockerfile.startsWith(`${context}/`);
}

export function validateOciBuildInput(input: unknown): OciBuildInput {
  if (!validate(input)) throw new Error(`OCI build contract invalid: ${safeErrors(validate.errors)}`);
  const resolved = structuredClone(input) as OciBuildInput;
  if (!isWithinContext(resolved.contextPath, resolved.dockerfilePath)) {
    throw new Error("OCI build contract invalid: /dockerfilePath must remain within /contextPath");
  }
  return resolved;
}

export function calculateOciBuildContractDigest(input: unknown): string {
  const valid = validateOciBuildInput(input);
  return `sha256:${createHash("sha256").update(canonical(valid)).digest("hex")}`;
}
