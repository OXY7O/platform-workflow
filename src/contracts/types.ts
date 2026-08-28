export type Readiness = "passed" | "failed" | "conditionally-passed";

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
  governanceVersion: "v1.1.0";
  catalogueVersion: "1.1.0";
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

export interface CheckResult {
  id: string;
  required: boolean;
  status: "passed" | "failed" | "not-run" | "not-applicable";
  failureCategory: FailureCategory | null;
  safeDiagnostic: string | null;
}
