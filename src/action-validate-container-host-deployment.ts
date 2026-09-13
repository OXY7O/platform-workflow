import * as core from "@actions/core";
import {calculateContainerHostDeploymentDigest, validateContainerHostDeployment} from "./validate-container-host-deployment.js";

try {
  const input = JSON.parse(core.getInput("contract-json", {required: true}));
  const resolved = validateContainerHostDeployment(input);
  core.setOutput("contract-digest", calculateContainerHostDeploymentDigest(resolved));
  core.setOutput("canonical-contract", JSON.stringify(resolved));
  core.setOutput("image-reference", resolved.imageReference);
  core.setOutput("image-digest", resolved.imageDigest);
  core.setOutput("target-id", resolved.targetId);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Container-host deployment contract invalid");
}
