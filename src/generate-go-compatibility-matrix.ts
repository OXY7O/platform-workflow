import fs from "node:fs";
import AjvModule from "ajv/dist/2020.js";
import type {GoCompatibilityInput} from "./contracts/go-types.js";
import {validateGoCompatibilityContract} from "./validate-go-compatibility-contract.js";

const laneSchema = JSON.parse(fs.readFileSync(
  new URL("../contracts/go-compatibility-input.schema.json", import.meta.url),
  "utf8",
));
const catalogueSchema = JSON.parse(fs.readFileSync(
  new URL("../contracts/go-compatibility-catalogue.schema.json", import.meta.url),
  "utf8",
));
const ajv = new AjvModule.default({allErrors: true, strict: true});
ajv.addSchema(laneSchema);
const validateCatalogue = ajv.compile(catalogueSchema);

export interface GoCompatibilityMatrix {
  include: GoCompatibilityInput[];
}

const requiredLane = "go-1.27.0-linux-amd64";

export function generateGoCompatibilityMatrix(catalogue: unknown): GoCompatibilityMatrix {
  if (!validateCatalogue(catalogue)) {
    throw new Error(`Go compatibility catalogue invalid: ${JSON.stringify(validateCatalogue.errors)}`);
  }
  const lanes = (catalogue as {lanes: Array<GoCompatibilityInput & {eligible?: boolean}>}).lanes;
  const identities = new Set<string>();
  for (const lane of lanes) {
    if (identities.has(lane.laneId)) throw new Error(`Duplicate Go lane: ${lane.laneId}`);
    identities.add(lane.laneId);
    if (typeof lane.eligible !== "boolean") throw new Error(`Go lane eligibility missing: ${lane.laneId}`);
    validateGoCompatibilityContract(Object.fromEntries(
      Object.entries(lane).filter(([key]) => key !== "eligible"),
    ));
  }

  const required = lanes.find((lane) => lane.laneId === requiredLane);
  if (!required) throw new Error(`Required lane missing: ${requiredLane}`);
  if (!required.blocking) throw new Error(`Required lane must be blocking: ${requiredLane}`);
  if (required.artifact) throw new Error(`Required compatibility lane must be artifactless: ${requiredLane}`);
  if (!required.eligible || required.executionMode !== "compatibility-only") {
    throw new Error(`Required lane is not eligible compatibility-only: ${requiredLane}`);
  }

  const runtime = Object.fromEntries(
    Object.entries(required).filter(([key]) => key !== "eligible"),
  );
  return {include: [validateGoCompatibilityContract(runtime)]};
}
