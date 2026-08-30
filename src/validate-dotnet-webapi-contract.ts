import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {DotnetWebApiInput} from "./contracts/dotnet-types.js";

const schema = JSON.parse(fs.readFileSync(
  new URL("../contracts/dotnet-webapi-input.schema.json", import.meta.url),
  "utf8",
));
const validate = new AjvModule.default({allErrors: true, strict: true}).compile(schema);

function safeErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
    .join("; ");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function validateDotnetWebApiContract(input: unknown): DotnetWebApiInput {
  if (!validate(input)) {
    throw new Error(`.NET Web API contract invalid: ${safeErrors(validate.errors)}`);
  }
  return structuredClone(input) as DotnetWebApiInput;
}

export function calculateDotnetWebApiContractDigest(input: unknown): string {
  const valid = validateDotnetWebApiContract(input);
  return `sha256:${createHash("sha256").update(canonical(valid)).digest("hex")}`;
}
