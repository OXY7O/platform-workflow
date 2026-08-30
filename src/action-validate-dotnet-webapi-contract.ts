import * as core from "@actions/core";
import {
  calculateDotnetWebApiContractDigest,
  validateDotnetWebApiContract,
} from "./validate-dotnet-webapi-contract.js";

try {
  const input = JSON.parse(core.getInput("contract-json", {required: true}));
  const resolved = validateDotnetWebApiContract(input);
  core.setOutput("contract-digest", calculateDotnetWebApiContractDigest(resolved));
  core.setOutput("profile-key", resolved.profileKey);
  core.setOutput("sdk-version", resolved.sdkVersion);
  core.setOutput("artifact-name", resolved.artifactName);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : ".NET Web API contract invalid");
}
