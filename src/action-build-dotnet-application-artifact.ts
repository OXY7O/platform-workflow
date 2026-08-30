import * as core from "@actions/core";
import {buildDotnetApplicationArtifact} from "./build-dotnet-application-artifact.js";
try {
  const result = await buildDotnetApplicationArtifact(JSON.parse(core.getInput("build-input", {required: true})));
  for (const [key, value] of Object.entries(result)) core.setOutput(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : ".NET application artifact build failed");
}
