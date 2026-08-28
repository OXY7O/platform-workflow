import * as core from "@actions/core";
import {calculateContractDigest, validateCaller} from "./validate-contract.js";

try {
  const input = JSON.parse(core.getInput("contract", {required: true}));
  const resolved = validateCaller(input);
  core.setOutput("resolved-profile", resolved.profileKey);
  core.setOutput("resolved-extensions", JSON.stringify(resolved.extensions));
  core.setOutput("contract-digest", calculateContractDigest(resolved));
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Caller contract invalid");
}
