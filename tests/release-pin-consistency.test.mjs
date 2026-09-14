import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const RELEASE_SHA = "00f95fc276c9374ce03fdd22f066d7f78a7a12a1";

test("v0.7.0 workflows and catalogue pin the squash-merge release SHA", () => {
  const files = [
    ".github/workflows/build-oci-php-laravel.yml",
    "catalogue/technology-stack.json"
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/OXY7O\/platform-workflow\/(?:actions\/validate-oci-build|\.github\/workflows\/build-oci-php-laravel\.yml)@([0-9a-f]{40})/g)) {
      assert.equal(match[1], RELEASE_SHA, `${file}: ${match[0]}`);
    }
  }
});
