import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {GoCompatibilityInput} from "./contracts/go-types.js";

const schema = JSON.parse(fs.readFileSync(
  new URL("../contracts/go-compatibility-input.schema.json", import.meta.url),
  "utf8",
));
const validate = new AjvModule.default({allErrors: true, strict: true}).compile(schema);

function errors(value: ErrorObject[] | null | undefined): string {
  return (value ?? []).map((item) => `${item.instancePath || "/"} ${item.message ?? "invalid"}`).join("; ");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function validateGoCompatibilityContract(input: unknown): GoCompatibilityInput {
  if (!validate(input)) throw new Error(`Go compatibility contract invalid: ${errors(validate.errors)}`);
  const value = input as GoCompatibilityInput;
  if (value.laneId !== `go-${value.goVersion}-${value.targetOs}-${value.targetArch}`) {
    throw new Error("Go compatibility contract invalid: lane identity contradicts version or target");
  }
  if (value.executionMode === "compatibility-only" && value.artifact) {
    throw new Error("Go compatibility contract invalid: compatibility lane must be artifactless");
  }
  return structuredClone(value);
}

export function calculateGoCompatibilityDigest(input: unknown): string {
  return `sha256:${createHash("sha256").update(canonical(validateGoCompatibilityContract(input))).digest("hex")}`;
}
