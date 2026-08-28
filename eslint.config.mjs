import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {ignores: ["dist/**", "lib/**", "node_modules/**"]},
  {files: ["tests/**/*.mjs"], languageOptions: {globals: {process: "readonly"}}}
);
