export type Readiness = "passed" | "failed" | "conditionally-passed";

export interface CompatibilityInput {
  schemaVersion: "1.0";
  profileKey: "php-laravel";
  laneId: string;
  frameworkMajor: number;
  phpVersion: string;
  workingDirectory: string;
  dependencyMode: "composer-frozen";
  testCommandProfile: "phpunit" | "pest";
  executionMode: "compatibility-only" | "exception-only";
  lifecycle: "active" | "security-only" | "preview" | "legacy-eol";
  blocking: boolean;
}

export type FailureCategory =
  | "contract"
  | "configuration"
  | "dependency"
  | "quality"
  | "test"
  | "security"
  | "artifact"
  | "runner"
  | "tooling-transient"
  | "platform-internal";

export interface CallerInput {
  governanceVersion: "v1.5.0";
  catalogueVersion: "1.2.0";
  profileKey: "php-laravel";
  phpVersion: string;
  dependencyMode: "composer-frozen";
  testCommandProfile: "phpunit" | "pest";
  artifactType: "application-package";
  extensions: string[];
  workingDirectory: string;
  coverageThreshold: number;
  retentionDays: number;
  evidenceMode: "safe-metadata";
}

export interface OciBuildInput {
  schemaVersion: "1.0";
  governanceVersion: "v1.5.0";
  catalogueVersion: "1.2.0";
  profileKey: "php-laravel";
  sourceSha: string;
  artifactId: string;
  imageRepository: string;
  dockerfilePath: string;
  contextPath: string;
  platforms: ("linux/amd64" | "linux/arm64")[];
  retentionDays: number;
  evidenceMode: "safe-metadata";
}

export interface CheckResult {
  id: string;
  required: boolean;
  status: "passed" | "failed" | "not-run" | "not-applicable";
  failureCategory: FailureCategory | null;
  safeDiagnostic: string | null;
}

export interface SafeEvidence {
  schemaVersion: "1.0";
  governanceVersion: "v1.5.0";
  catalogueVersion: "1.2.0";
  profileKey: "php-laravel";
  sourceSha: string;
  workflowSha: string;
  contractDigest: string;
  runnerClass: string;
  runnerImage: string;
  checks: CheckResult[];
  artifact: null | {id: string; name: string; type: "application-package"; digest: string; manifestDigest: string};
  evidenceReference: string | null;
}
