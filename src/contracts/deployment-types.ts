export interface ContainerHostDeploymentInput {
  schemaVersion: "1.0";
  governanceVersion: "v1.5.0";
  catalogueVersion: "1.2.0";
  profileKey: "php-laravel";
  environment: "development";
  targetId: "laravel-development-container-host";
  sourceSha: string;
  workflowSha: string;
  artifactId: string;
  imageReference: string;
  imageDigest: string;
  composePath: string;
  services: Array<"web" | "queue" | "scheduler">;
  healthPath: "/up";
  healthTimeoutSeconds: number;
  healthRetries: number;
  lkgImageDigest: string | null;
  promotionReference: string | null;
  evidenceMode: "safe-metadata";
}
