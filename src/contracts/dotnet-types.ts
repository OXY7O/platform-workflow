export interface DotnetWebApiInput {
  schemaVersion: "1.0";
  governanceVersion: "v1.3.0";
  catalogueVersion: "1.3.0";
  profileKey: "dotnet-webapi";
  sdkVersion: "10.0.110";
  targetFramework: "net10.0";
  solutionPath: string;
  projectPath: string;
  testProjectPath: string;
  artifactName: string;
  applicationVersion: string;
  runtimeIdentifier: "linux-x64";
  publishMode: "framework-dependent";
  coverageThreshold: number;
  retentionDays: number;
  evidenceMode: "safe-metadata";
  extensions: [];
}
