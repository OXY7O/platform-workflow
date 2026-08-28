import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import type {CallerInput} from "./contracts/types.js";

const schema = JSON.parse(fs.readFileSync(new URL("../contracts/workflow-input.schema.json", import.meta.url), "utf8"));
const Ajv2020 = AjvModule.default;
const addFormats = addFormatsModule.default;
const ajv = new Ajv2020({allErrors: true, strict: true});
addFormats(ajv);
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

export function validateCaller(input: unknown): CallerInput {
  if (!validate(input)) throw new Error(`Caller contract invalid: ${safeErrors(validate.errors)}`);
  return structuredClone(input) as CallerInput;
}

export function calculateContractDigest(input: unknown): string {
  const valid = validateCaller(input);
  return `sha256:${createHash("sha256").update(canonical(valid)).digest("hex")}`;
}
