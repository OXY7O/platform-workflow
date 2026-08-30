import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {generateGoCompatibilityMatrix} from "../lib/generate-go-compatibility-matrix.js";

const fixture = () => JSON.parse(
  fs.readFileSync("tests/fixtures/compatibility/go-service.json", "utf8"),
);

test("generates only the required artifactless Go compatibility lane", () => {
  assert.deepEqual(generateGoCompatibilityMatrix(fixture()), {
    include: [{
      laneId: "go-1.27.0-linux-amd64",
      goVersion: "1.27.0",
      targetOs: "linux",
      targetArch: "amd64",
      workingDirectory: ".",
      executionMode: "compatibility-only",
      lifecycle: "active",
      blocking: true,
      artifact: false,
    }],
  });
});

test("rejects missing, duplicate, nonblocking, and artifact-enabled required lanes", () => {
  const missing = fixture();
  missing.lanes = missing.lanes.filter((lane) => lane.goVersion !== "1.27.0");
  assert.throws(() => generateGoCompatibilityMatrix(missing), /required lane/i);

  const duplicate = fixture();
  duplicate.lanes.push({...duplicate.lanes[1]});
  assert.throws(() => generateGoCompatibilityMatrix(duplicate), /duplicate/i);

  for (const change of [{blocking: false}, {artifact: true}]) {
    const value = fixture();
    Object.assign(value.lanes[1], change);
    assert.throws(() => generateGoCompatibilityMatrix(value), /blocking|artifactless/i);
  }
});

test("rejects a lane identity that contradicts version or target", () => {
  const value = fixture();
  value.lanes[1].laneId = "go-1.26.7-linux-amd64";
  assert.throws(() => generateGoCompatibilityMatrix(value), /identity|duplicate/i);
});

test("matrix action enforces relative realpath containment", () => {
  const source = fs.readFileSync("src/action-generate-go-compatibility-matrix.ts", "utf8");
  assert.match(source, /path\.isAbsolute/);
  assert.match(source, /realpathSync/);
  assert.match(source, /must remain within repository/);
});
