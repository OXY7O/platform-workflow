import {createHash} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {gzipSync} from "node:zlib";
import AjvModule from "ajv/dist/2020.js";

export interface GoBinaryArtifactInput {
  binaryPath: string;
  outputDirectory: string;
  binaryName: string;
  applicationVersion: string;
  sourceSha: string;
  workflowSha: string;
  contractDigest: string;
  moduleDigest: string;
  goVersion: "1.26.7";
  targetOs: "linux";
  targetArch: "amd64";
  retentionDays: number;
  createdAt?: string;
}

export interface GoBinaryArtifactOutput {
  artifactPath: string;
  artifactId: string;
  artifactName: string;
  digest: string;
  manifestPath: string;
  manifestDigest: string;
  readiness: "ci-qualified";
}

const inputSchema = JSON.parse(fs.readFileSync(
  new URL("../contracts/go-binary-artifact-input.schema.json", import.meta.url),
  "utf8",
));
const validate = new AjvModule.default({allErrors: true, strict: true}).compile(inputSchema);
const privateKey = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

function octal(value: number, width: number): string {
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function tarEntry(name: string, content: Buffer, mode: number): Buffer {
  if (Buffer.byteLength(name) > 100) throw new Error(`Invalid TAR path: ${name}`);
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "utf8");
  header.write(octal(mode, 8), 100, 8, "ascii");
  header.write(octal(0, 8), 108, 8, "ascii");
  header.write(octal(0, 8), 116, 8, "ascii");
  header.write(octal(content.length, 12), 124, 12, "ascii");
  header.write(octal(0, 12), 136, 12, "ascii");
  header.fill(0x20, 148, 156);
  header[156] = 0x30;
  header.write("ustar\0", 257, 6, "ascii");
  header.write("00", 263, 2, "ascii");
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");
  const padding = Buffer.alloc((512 - (content.length % 512)) % 512);
  return Buffer.concat([header, content, padding]);
}

export async function buildGoBinaryArtifact(
  input: GoBinaryArtifactInput,
): Promise<GoBinaryArtifactOutput> {
  if (!validate(input)) {
    throw new Error(`Go binary artifact input invalid: ${JSON.stringify(validate.errors)}`);
  }
  const stat = fs.lstatSync(input.binaryPath);
  const baseName = path.basename(input.binaryPath);
  if (stat.isSymbolicLink()) throw new Error("Prohibited symbolic link binary input");
  if (!stat.isFile() || (stat.mode & 0o111) === 0) throw new Error("Invalid executable binary input");
  if (baseName.startsWith(".env") || /\.(?:pem|key)$/i.test(baseName)) {
    throw new Error(`Prohibited binary path: ${baseName}`);
  }
  const binary = fs.readFileSync(input.binaryPath);
  if (privateKey.test(binary.toString("utf8"))) throw new Error("Private key material detected in binary input");

  const artifactName = `${input.binaryName}_${input.applicationVersion}_linux_amd64.tar.gz`;
  const artifactId = `ART-go-service-${input.sourceSha.slice(0, 12)}-${input.contractDigest.slice(7, 19)}`;
  const manifest = {
    schemaVersion: "1.0",
    artifactId,
    artifactName,
    type: "binary",
    sourceSha: input.sourceSha,
    workflowSha: input.workflowSha,
    governanceVersion: "v1.2.0",
    catalogueVersion: "1.2.0",
    profileKey: "go-service",
    contractDigest: input.contractDigest,
    moduleDigest: input.moduleDigest,
    goVersion: input.goVersion,
    target: "linux/amd64",
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
    retentionDays: input.retentionDays,
    files: [{path: input.binaryName, size: binary.length, mode: "0755", sha256: digest(binary)}],
  } as const;
  const manifestJson = JSON.stringify(manifest);
  const tar = Buffer.concat([
    tarEntry(input.binaryName, binary, 0o755),
    tarEntry("manifest.json", Buffer.from(manifestJson), 0o644),
    Buffer.alloc(1024),
  ]);

  fs.mkdirSync(input.outputDirectory, {recursive: true});
  const artifactPath = path.join(input.outputDirectory, artifactName);
  const manifestPath = path.join(input.outputDirectory, `${artifactId}.manifest.json`);
  fs.writeFileSync(artifactPath, gzipSync(tar, {level: 9, mtime: 0} as never));
  fs.writeFileSync(manifestPath, `${manifestJson}\n`);
  return {
    artifactPath,
    artifactId,
    artifactName,
    digest: `sha256:${digest(fs.readFileSync(artifactPath))}`,
    manifestPath,
    manifestDigest: `sha256:${digest(manifestJson)}`,
    readiness: "ci-qualified",
  };
}
