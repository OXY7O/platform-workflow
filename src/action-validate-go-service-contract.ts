import * as core from "@actions/core";
import {
  calculateGoServiceContractDigest,
  validateGoServiceContract,
} from "./validate-go-service-contract.js";

try {
  const input = JSON.parse(core.getInput("contract-json", {required: true}));
  const resolved = validateGoServiceContract(input);
  core.setOutput("contract-digest", calculateGoServiceContractDigest(resolved));
  core.setOutput("profile-key", resolved.profileKey);
  core.setOutput("go-version", resolved.goVersion);
  core.setOutput("binary-name", resolved.binaryName);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Go Service contract invalid");
}
