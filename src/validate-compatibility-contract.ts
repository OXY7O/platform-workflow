import {createHash} from "node:crypto";
import fs from "node:fs";
import AjvModule, {type ErrorObject} from "ajv/dist/2020.js";
import type {CompatibilityInput} from "./contracts/types.js";

const schema = JSON.parse(fs.readFileSync(new URL("../contracts/compatibility-input.schema.json", import.meta.url), "utf8"));
const Ajv2020 = AjvModule.default;
const validate = new Ajv2020({allErrors:true, strict:true}).compile(schema);
const errors = (items: ErrorObject[] | null | undefined) => (items ?? []).map(e => `${e.instancePath || "/"} ${e.message ?? "invalid"}`).join("; ");
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value as Record<string,unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}` : JSON.stringify(value);

export function validateCompatibilityContract(input: unknown): CompatibilityInput {
  if (!validate(input)) throw new Error(`Compatibility contract invalid: ${errors(validate.errors)}`);
  const value=structuredClone(input) as CompatibilityInput;
  if(value.laneId!==`laravel-${value.frameworkMajor}-php-${value.phpVersion}`) throw new Error("Compatibility contract invalid: lane identity contradicts frameworkMajor/phpVersion");
  return value;
}
export function calculateCompatibilityContractDigest(input: unknown): string {
  return `sha256:${createHash("sha256").update(canonical(validateCompatibilityContract(input))).digest("hex")}`;
}
