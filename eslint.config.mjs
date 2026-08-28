import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {ignores: ["dist/**", "lib/**", "node_modules/**"]},
  {files: ["tests/**/*.mjs"], languageOptions: {globals: {process: "readonly"}}},
  {files: ["scripts/**/*.mjs"], languageOptions: {globals: {console: "readonly", process: "readonly"}}}
);
