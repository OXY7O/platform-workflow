import * as core from "@actions/core";
import {calculateOciBuildContractDigest, validateOciBuildInput} from "./validate-oci-build-input.js";

try {
  const input = JSON.parse(core.getInput("contract-json", {required: true}));
  const resolved = validateOciBuildInput(input);
  core.setOutput("contract-digest", calculateOciBuildContractDigest(resolved));
  core.setOutput("canonical-contract", JSON.stringify(resolved));
  core.setOutput("image-repository", resolved.imageRepository);
  core.setOutput("platforms", resolved.platforms.join(","));
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "OCI build contract invalid");
}
