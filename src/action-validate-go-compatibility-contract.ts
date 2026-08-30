import * as core from "@actions/core";
import {
  calculateGoCompatibilityDigest,
  validateGoCompatibilityContract,
} from "./validate-go-compatibility-contract.js";

try {
  const value = validateGoCompatibilityContract(
    JSON.parse(core.getInput("contract-json", {required: true})),
  );
  core.setOutput("contract-digest", calculateGoCompatibilityDigest(value));
  core.setOutput("lane-id", value.laneId);
  core.setOutput("go-version", value.goVersion);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Go compatibility contract invalid");
}
