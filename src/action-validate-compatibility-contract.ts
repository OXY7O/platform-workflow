import * as core from "@actions/core";
import {calculateCompatibilityContractDigest, validateCompatibilityContract} from "./validate-compatibility-contract.js";
try {
  const value = validateCompatibilityContract(JSON.parse(core.getInput("contract", {required:true})));
  core.setOutput("lane-id", value.laneId);
  core.setOutput("blocking", String(value.blocking));
  core.setOutput("contract-digest", calculateCompatibilityContractDigest(value));
} catch (error) { core.setFailed(error instanceof Error ? error.message : "Compatibility contract invalid"); }
