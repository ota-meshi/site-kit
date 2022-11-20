module.exports = {
  root: true,
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
  },
  extends: [
    "eslint:recommended",
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
    "plugin:@ota-meshi/+md",
    "plugin:svelte/recommended",
    "plugin:@ota-meshi/+prettier",
  ],
  rules: {
    "require-jsdoc": "off",
  },
  overrides: [
    {
      files: ["*.vue"],
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@ota-meshi/+typescript",
        "plugin:@ota-meshi/+vue3",
        "plugin:@ota-meshi/+prettier",
      ],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "typescript-eslint-parser-for-extra-files",
        project: ["./tsconfig.json"],
      },
      rules: {
        "no-shadow": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: ["*.svelte"],
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@ota-meshi/+typescript",
        "plugin:@ota-meshi/+svelte-with-ts",
      ],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "typescript-eslint-parser-for-extra-files",
        project: ["./tsconfig.json"],
      },
      rules: {
        "no-shadow": "off",
        "one-var": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: ["*.ts", "*.mts"],
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@ota-meshi/+typescript",
      ],
      parser: "typescript-eslint-parser-for-extra-files",
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
