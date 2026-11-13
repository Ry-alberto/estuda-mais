// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "prisma/**", "eslint.config.mjs"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Project rule (RNF / perfil): no `any` in TypeScript.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
