import globals from "globals";
import vueParser from "vue-eslint-parser";
import svelteParser from "svelte-eslint-parser";
import * as tsParser from "typescript-eslint-parser-for-extra-files";
import myPlugin from "@ota-meshi/eslint-plugin";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/.DS_Store",
      "**/node_modules",
      "**/.env",
      "**/.env.*",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
      "**/yarn.lock",
      "packages/site-kit-monaco-editor/lib",
      "packages/site-kit-monarch-syntaxes/lib",
      "packages/site-kit-monaco-editor-vue/MonacoEditor.vue.d.ts",
      "packages/site-kit-monaco-editor-vue/MonacoEditor.vue3.js",
      "packages/site-kit-monaco-editor-vue/MonacoEditor.vue2.js",
      "packages/site-kit-eslint-editor-vue/ESLintEditor.vue.d.ts",
      "packages/site-kit-eslint-editor-vue/ESLintEditor.vue3.js",
      "packages/site-kit-eslint-editor-vue/ESLintEditor.vue2.js",
    ],
  },
  ...myPlugin.config({
    json: true,
    packageJson: true,
    yaml: true,
    md: true,
    svelte: true,
    prettier: true,
  }),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "require-jsdoc": "off",
    },
  },
  ...tseslint.config({
    files: ["**/*.vue"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...myPlugin.config({
        vue3: true,
        ts: true,
        prettier: true,
      }),
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: "typescript-eslint-parser-for-extra-files",
        project: ["./tsconfig.json"],
      },
    },

    rules: {
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
  ...tseslint.config({
    files: ["**/*.svelte"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...myPlugin.config({
        svelte: true,
        ts: true,
        prettier: true,
      }),
    ],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: "typescript-eslint-parser-for-extra-files",
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      "no-shadow": "off",
      "one-var": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
  ...tseslint.config({
    files: ["**/*.ts", "**/*.mts"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...myPlugin.config({
        ts: true,
        prettier: true,
      }),
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
];
