import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {DotnetCompatibilityInput} from "./contracts/dotnet-types.js";
const schema = JSON.parse(fs.readFileSync(new URL("../contracts/dotnet-compatibility-input.schema.json", import.meta.url), "utf8"));
const validate = new AjvModule.default({allErrors: true, strict: true}).compile(schema);
const errors = (value: ErrorObject[] | null | undefined) => (value ?? []).map((item) => `${item.instancePath || "/"} ${item.message ?? "invalid"}`).join("; ");
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`; return JSON.stringify(value); }
export function validateDotnetCompatibilityContract(input: unknown): DotnetCompatibilityInput {
  if (!validate(input)) throw new Error(`.NET compatibility contract invalid: ${errors(validate.errors)}`);
  const value = input as DotnetCompatibilityInput;
  if (value.laneId !== `dotnet-sdk-${value.sdkVersion}-${value.targetFramework}-${value.runtimeIdentifier}`) throw new Error(".NET compatibility identity contradicts version or target");
  if (value.sdkVersion === "11.0.100-preview.6.26359.118" && (value.lifecycle !== "preview" || value.executionMode !== "compatibility-only" || value.blocking || value.artifact)) throw new Error(".NET preview must be non-blocking, compatibility-only, and artifactless");
  return structuredClone(value);
}
export function calculateDotnetCompatibilityDigest(input: unknown): string { return `sha256:${createHash("sha256").update(canonical(validateDotnetCompatibilityContract(input))).digest("hex")}`; }
