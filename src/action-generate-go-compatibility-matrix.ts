import * as core from "@actions/core";
import fs from "node:fs";
import path from "node:path";
import {generateGoCompatibilityMatrix} from "./generate-go-compatibility-matrix.js";

try {
  const relative = core.getInput("catalogue-path", {required: true});
  if (path.isAbsolute(relative)) throw new Error("Go catalogue path must be relative");
  const repositoryRoot = fs.realpathSync(path.resolve("."));
  const resolved = fs.realpathSync(path.resolve(relative));
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error("Go catalogue path must remain within repository");
  }
  const catalogue = JSON.parse(fs.readFileSync(resolved, "utf8"));
  core.setOutput("matrix-json", JSON.stringify(generateGoCompatibilityMatrix(catalogue)));
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : "Go compatibility matrix generation failed");
}
