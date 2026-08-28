import fs from "node:fs";
import {parse} from "yaml";

interface FamilyConfig {family_key: string; runtime: string; dependency_manager: string; dependency_mode: string; cache_key_dimensions: string[]; required_checks: string[]}
interface ProfileConfig {profile_key: string; family_key: string; structure_markers: string[]; test_presets: string[]; required_checks: string[]; artifact_type: "application-package"; prohibited_artifact_patterns: string[]}
export interface ResolvedProfile {
  profileKey: "php-laravel";
  familyKey: "php";
  runtime: string;
  dependencyManager: string;
  dependencyMode: string;
  cacheKeyDimensions: readonly string[];
  structureMarkers: readonly string[];
  testPresets: readonly string[];
  requiredChecks: string[];
  artifactType: "application-package";
  prohibitedArtifactPatterns: readonly string[];
}

function readYaml<T>(relative: string): T {
  return parse(fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8")) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function loadProfile(profileKey: "php-laravel"): ResolvedProfile {
  if (profileKey !== "php-laravel") throw new Error(`Unknown profile: ${profileKey}`);
  const family = readYaml<FamilyConfig>("profiles/php/family.yaml");
  const profile = readYaml<ProfileConfig>("profiles/php-laravel/profile.yaml");
  if (profile.family_key !== family.family_key) throw new Error("Profile family mismatch");
  const requiredChecks = [...family.required_checks, ...profile.required_checks];
  if (new Set(requiredChecks).size !== requiredChecks.length) throw new Error("Conflicting duplicate check ID");
  return deepFreeze({
    profileKey: profile.profile_key as "php-laravel", familyKey: family.family_key as "php",
    runtime: family.runtime, dependencyManager: family.dependency_manager,
    dependencyMode: family.dependency_mode, cacheKeyDimensions: [...family.cache_key_dimensions],
    structureMarkers: [...profile.structure_markers], testPresets: [...profile.test_presets],
    requiredChecks, artifactType: profile.artifact_type,
    prohibitedArtifactPatterns: [...profile.prohibited_artifact_patterns]
  });
}
