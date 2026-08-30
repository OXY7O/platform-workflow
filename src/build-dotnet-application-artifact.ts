import {createHash} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {gzipSync} from "node:zlib";
import AjvModule from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

export interface DotnetApplicationArtifactInput {
  publishDirectory: string; outputDirectory: string; artifactName: string;
  applicationVersion: string; sourceSha: string; workflowSha: string;
  contractDigest: string; dependencyDigest: string; sdkVersion: "10.0.110";
  targetFramework: "net10.0"; runtimeIdentifier: "linux-x64";
  publishMode: "framework-dependent"; retentionDays: number; createdAt?: string;
}
export interface DotnetApplicationArtifactOutput {
  artifactPath: string; artifactId: string; artifactName: string; digest: string;
  manifestPath: string; manifestDigest: string; readiness: "ci-qualified";
}

const ajv = new AjvModule.default({allErrors: true, strict: true}); addFormatsModule.default(ajv);
const inputSchema = JSON.parse(fs.readFileSync(new URL("../contracts/dotnet-application-artifact-input.schema.json", import.meta.url), "utf8"));
const manifestSchema = JSON.parse(fs.readFileSync(new URL("../contracts/dotnet-application-manifest.schema.json", import.meta.url), "utf8"));
const validateInput = ajv.compile(inputSchema); const validateManifest = ajv.compile(manifestSchema);
const privateKey = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const prohibitedPath = /(^|\/)(?:\.env(?:\..*)?|[^/]+\.(?:pem|key|cs|csproj)|coverage(?:\..*)?|libcoreclr\.so|coreclr)$/i;
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

function octal(value: number, width: number): string { return value.toString(8).padStart(width - 1, "0") + "\0"; }
function tarEntry(name: string, content: Buffer, mode: number): Buffer {
  if (Buffer.byteLength(name) > 100) throw new Error(`Invalid TAR path: ${name}`);
  const header = Buffer.alloc(512); header.write(name, 0, 100, "utf8");
  header.write(octal(mode, 8), 100, 8, "ascii"); header.write(octal(0, 8), 108, 8, "ascii");
  header.write(octal(0, 8), 116, 8, "ascii"); header.write(octal(content.length, 12), 124, 12, "ascii");
  header.write(octal(0, 12), 136, 12, "ascii"); header.fill(0x20, 148, 156); header[156] = 0x30;
  header.write("ustar\0", 257, 6, "ascii"); header.write("00", 263, 2, "ascii");
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");
  return Buffer.concat([header, content, Buffer.alloc((512 - (content.length % 512)) % 512)]);
}
function contained(child: string, parent: string): boolean { return child === parent || child.startsWith(`${parent}${path.sep}`); }
function enumerate(root: string, current = root): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(current, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(current, entry.name); const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Prohibited symbolic link: ${path.relative(root, absolute)}`);
    if (stat.isDirectory()) result.push(...enumerate(root, absolute)); else if (stat.isFile()) result.push(absolute);
    else throw new Error(`Prohibited publish entry: ${path.relative(root, absolute)}`);
  }
  return result;
}

export async function buildDotnetApplicationArtifact(input: DotnetApplicationArtifactInput): Promise<DotnetApplicationArtifactOutput> {
  if (!validateInput(input)) throw new Error(`.NET application artifact input invalid: ${JSON.stringify(validateInput.errors)}`);
  const publishRoot = fs.realpathSync(input.publishDirectory); const stat = fs.lstatSync(input.publishDirectory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Invalid publish directory");
  const runnerRoot = fs.realpathSync(process.env.RUNNER_TEMP ?? "");
  if (!path.isAbsolute(input.outputDirectory) || !contained(path.resolve(input.outputDirectory), runnerRoot)) throw new Error("Invalid output directory outside RUNNER_TEMP");
  const files = enumerate(publishRoot); if (files.length === 0) throw new Error("Invalid empty publish directory");
  const records = files.map((absolute) => {
    const relative = path.relative(publishRoot, absolute).split(path.sep).join("/");
    if (prohibitedPath.test(relative) || /Tests/i.test(relative)) throw new Error(`Prohibited publish path: ${relative}`);
    const content = fs.readFileSync(absolute); if (privateKey.test(content.toString("utf8"))) throw new Error("Private key material detected");
    const executable = (fs.statSync(absolute).mode & 0o111) !== 0;
    return {relative, content, mode: executable ? 0o755 : 0o644, modeText: executable ? "0755" : "0644"};
  }).sort((a, b) => a.relative.localeCompare(b.relative));
  const artifactName = `${input.artifactName}_${input.applicationVersion}_net10.0_linux-x64.tar.gz`;
  const artifactId = `ART-dotnet-webapi-${input.sourceSha.slice(0, 12)}-${input.contractDigest.slice(7, 19)}`;
  const manifest = {schemaVersion: "1.0", artifactId, artifactName, type: "application-package", readiness: "ci-qualified", sourceSha: input.sourceSha, workflowSha: input.workflowSha, governanceVersion: "v1.3.0", catalogueVersion: "1.3.0", profileKey: "dotnet-webapi", contractDigest: input.contractDigest, dependencyDigest: input.dependencyDigest, sdkVersion: input.sdkVersion, targetFramework: input.targetFramework, runtimeIdentifier: input.runtimeIdentifier, publishMode: input.publishMode, createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z", retentionDays: input.retentionDays, files: records.map((record) => ({path: record.relative, size: record.content.length, mode: record.modeText, sha256: digest(record.content)}))};
  if (!validateManifest(manifest)) throw new Error(`.NET application manifest invalid: ${JSON.stringify(validateManifest.errors)}`);
  const manifestJson = JSON.stringify(manifest);
  const tar = Buffer.concat([...records.map((record) => tarEntry(record.relative, record.content, record.mode)), tarEntry("manifest.json", Buffer.from(manifestJson), 0o644), Buffer.alloc(1024)]);
  fs.mkdirSync(input.outputDirectory, {recursive: true});
  const artifactPath = path.join(input.outputDirectory, artifactName); const manifestPath = path.join(input.outputDirectory, `${artifactId}.manifest.json`);
  fs.writeFileSync(artifactPath, gzipSync(tar, {level: 9, mtime: 0} as never)); fs.writeFileSync(manifestPath, `${manifestJson}\n`);
  return {artifactPath, artifactId, artifactName, digest: `sha256:${digest(fs.readFileSync(artifactPath))}`, manifestPath, manifestDigest: `sha256:${digest(manifestJson)}`, readiness: "ci-qualified"};
}
