import * as core from "@actions/core";
import {buildGoBinaryArtifact} from "./build-go-binary-artifact.js";

try {
  const result = await buildGoBinaryArtifact(
    JSON.parse(core.getInput("build-input", {required: true})),
  );
  for (const [key, value] of Object.entries(result)) {
    core.setOutput(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value);
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Go binary artifact build failed");
}
