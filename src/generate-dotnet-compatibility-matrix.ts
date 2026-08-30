import fs from "node:fs";
import AjvModule from "ajv/dist/2020.js";
import type {DotnetCompatibilityInput} from "./contracts/dotnet-types.js";
import {validateDotnetCompatibilityContract} from "./validate-dotnet-compatibility-contract.js";
const laneSchema = JSON.parse(fs.readFileSync(new URL("../contracts/dotnet-compatibility-input.schema.json", import.meta.url), "utf8"));
const catalogueSchema = JSON.parse(fs.readFileSync(new URL("../contracts/dotnet-compatibility-catalogue.schema.json", import.meta.url), "utf8"));
const ajv = new AjvModule.default({allErrors: true, strict: true}); ajv.addSchema(laneSchema); const validateCatalogue = ajv.compile(catalogueSchema);
const canonicalId = "dotnet-sdk-10.0.110-net10.0-linux-x64"; const previewId = "dotnet-sdk-11.0.100-preview.6.26359.118-net10.0-linux-x64";
export function generateDotnetCompatibilityMatrix(catalogue: unknown, options: {includePreview: boolean}): {include: DotnetCompatibilityInput[]} {
  if (!validateCatalogue(catalogue)) throw new Error(`.NET compatibility catalogue invalid: ${JSON.stringify(validateCatalogue.errors)}`);
  const lanes = (catalogue as {lanes: DotnetCompatibilityInput[]}).lanes; const identities = new Set<string>();
  for (const lane of lanes) { if (identities.has(lane.laneId)) throw new Error(`Duplicate .NET lane: ${lane.laneId}`); identities.add(lane.laneId); validateDotnetCompatibilityContract(lane); }
  const canonical = lanes.find((lane) => lane.laneId === canonicalId);
  if (!canonical || canonical.sdkVersion !== "10.0.110" || canonical.executionMode !== "canonical-artifact" || !canonical.blocking || !canonical.artifact || canonical.lifecycle !== "active") throw new Error("Canonical .NET lane invalid");
  const preview = lanes.find((lane) => lane.laneId === previewId);
  if (!preview || preview.eligible !== true) throw new Error("Required .NET preview lane missing or ineligible");
  if (!options.includePreview) return {include: []};
  const runtime = Object.fromEntries(Object.entries(preview).filter(([key]) => key !== "eligible"));
  return {include: [validateDotnetCompatibilityContract(runtime)]};
}
