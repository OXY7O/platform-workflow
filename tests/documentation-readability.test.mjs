import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("README guides PHP Laravel consumers from purpose to adoption", () => {
  const readme = read("README.md");

  for (const text of [
    "Versi release",
    "Status CI",
    "Profil PHP/Laravel",
    "Tanpa deployment",
    "Siapa yang menggunakan repository ini?",
    "Alur kerja dalam satu tampilan",
    "Pilih workflow yang tepat",
    "Mulai cepat",
    "Dukungan versi PHP dan Laravel",
    "Output yang diterima caller",
    "Batasan penting",
    "Jika pemeriksaan gagal",
  ]) {
    assert.match(readme, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(readme, /releases\/tag\/v0\.2\.1/);
  assert.match(readme, /actions\/workflows\/validate-platform-workflow\.yml/);
});

test("v0.2.1 release note explains user impact and adoption", () => {
  const changelog = read("CHANGELOG.md");
  assert.match(changelog, /## \[0\.2\.1\]/);
  assert.match(changelog, /Dampak bagi pengguna/);
  assert.match(changelog, /Cara mengadopsi/);
  assert.match(changelog, /Tidak ada perubahan kontrak/);
});
