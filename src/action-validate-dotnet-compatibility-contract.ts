import * as core from "@actions/core";
import {calculateDotnetCompatibilityDigest, validateDotnetCompatibilityContract} from "./validate-dotnet-compatibility-contract.js";
try { const value = validateDotnetCompatibilityContract(JSON.parse(core.getInput("contract-json", {required: true}))); core.setOutput("contract-digest", calculateDotnetCompatibilityDigest(value)); core.setOutput("lane-id", value.laneId); core.setOutput("sdk-version", value.sdkVersion); } catch (error) { core.setFailed(error instanceof Error ? error.message : ".NET compatibility contract invalid"); }
