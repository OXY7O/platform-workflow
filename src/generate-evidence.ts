import type {SafeEvidence} from "./contracts/types.js";

const allowed = new Set(["schemaVersion", "governanceVersion", "catalogueVersion", "profileKey", "sourceSha", "workflowSha", "contractDigest", "runnerClass", "runnerImage", "checks", "artifact", "evidenceReference"]);
const unsafeKey = /secret|token|password|private.?key|credential/i;
const unsafeValue = /gh[pousr]_[A-Za-z0-9_]+|-----BEGIN [A-Z ]*PRIVATE KEY-----/;

function inspect(value: unknown, path: string): void {
  if (typeof value === "string" && unsafeValue.test(value)) throw new Error(`Unsafe evidence at ${path}`);
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (unsafeKey.test(key)) throw new Error(`Unsafe evidence key at ${path}.${key}`);
      inspect(item, `${path}.${key}`);
    }
  }
}

export function generateEvidence(input: unknown): SafeEvidence {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Unsafe evidence input");
  const record = input as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`Unsafe evidence keys: ${unknown.join(",")}`);
  inspect(record, "$evidence");
  return structuredClone(record) as unknown as SafeEvidence;
}
