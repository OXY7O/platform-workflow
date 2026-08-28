import {createHash} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {gzipSync} from "node:zlib";

export interface BuildArtifactInput {workingDirectory: string; outputDirectory: string; sourceSha: string; workflowSha: string; contractDigest: string; lockDigest: string; retentionDays: number; createdAt?: string}
export interface BuildArtifactResult {artifactPath: string; artifactId: string; artifactName: string; digest: string; manifestPath: string; manifestDigest: string; readiness: "ci-qualified"}

const privateKey = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const sha = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

function prohibited(relative: string): boolean {
  const segments = relative.split("/");
  const name = segments.at(-1) ?? "";
  return name.startsWith(".env") || /\.(pem|key)$/i.test(name) || /^id_rsa/i.test(name) || segments.some((part) => [".git", "node_modules", "tests"].includes(part));
}

function filesUnder(root: string, current = ""): string[] {
  const directory = path.join(root, current);
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const relative = current ? `${current}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Prohibited symbolic link: ${relative}`);
    return entry.isDirectory() ? filesUnder(root, relative) : [relative];
  }).sort();
}

export async function buildArtifact(input: BuildArtifactInput): Promise<BuildArtifactResult> {
  const root = path.resolve(input.workingDirectory);
  const files = filesUnder(root);
  const payload: Record<string, string> = {};
  const fileRecords = files.map((relative) => {
    if (prohibited(relative)) throw new Error(`Prohibited artifact path: ${relative}`);
    const content = fs.readFileSync(path.join(root, relative));
    if (privateKey.test(content.toString("utf8"))) throw new Error(`Private key material detected: ${relative}`);
    payload[relative] = content.toString("base64");
    return {path: relative, size: content.length, sha256: sha(content)};
  });
  const artifactId = `ART-php-laravel-${input.sourceSha.slice(0, 12)}-${input.contractDigest.replace("sha256:", "").slice(0, 12)}`;
  const artifactName = `${artifactId}.json.gz`;
  const manifest = {schemaVersion: "1.0", artifactId, artifactName, type: "application-package", sourceSha: input.sourceSha, workflowSha: input.workflowSha, governanceVersion: "v1.1.0", catalogueVersion: "1.1.0", profileKey: "php-laravel", contractDigest: input.contractDigest, lockDigest: input.lockDigest, createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z", retentionDays: input.retentionDays, files: fileRecords};
  const manifestJson = JSON.stringify(manifest);
  const envelope = JSON.stringify({manifest, files: payload});
  fs.mkdirSync(input.outputDirectory, {recursive: true});
  const artifactPath = path.join(input.outputDirectory, artifactName);
  const manifestPath = path.join(input.outputDirectory, `${artifactId}.manifest.json`);
  fs.writeFileSync(manifestPath, `${manifestJson}\n`);
  fs.writeFileSync(artifactPath, gzipSync(envelope, {level: 9, mtime: 0} as never));
  return {artifactPath, artifactId, artifactName, digest: `sha256:${sha(fs.readFileSync(artifactPath))}`, manifestPath, manifestDigest: `sha256:${sha(manifestJson)}`, readiness: "ci-qualified"};
}
