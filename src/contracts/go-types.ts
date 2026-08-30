export interface GoServiceInput {
  schemaVersion: "1.0";
  governanceVersion: "v1.2.0";
  catalogueVersion: "1.2.0";
  profileKey: "go-service";
  goVersion: "1.26.7";
  modulePath: string;
  binaryName: string;
  applicationVersion: string;
  mainPackage: string;
  artifactType: "binary";
  targetOs: "linux";
  targetArch: "amd64";
  workingDirectory: string;
  coverageThreshold: number;
  retentionDays: number;
  evidenceMode: "safe-metadata";
}

export interface GoCompatibilityInput {
  laneId: string;
  goVersion: "1.26.7" | "1.27.0";
  targetOs: "linux";
  targetArch: "amd64";
  workingDirectory: string;
  executionMode: "canonical-artifact" | "compatibility-only";
  lifecycle: "active" | "preview" | "legacy-eol";
  blocking: boolean;
  eligible: boolean;
  artifact: boolean;
}
