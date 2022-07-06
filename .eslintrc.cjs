module.exports = {
  root: true,
  plugins: ['solid', 'prettier'],
  extends: ['@antfu/eslint-config-ts', 'plugin:solid/typescript', 'prettier', 'plugin:astro/recommended'],
  ignorePatterns: ['**/node_modules', '**/dist', 'generated'],
  rules: {
    'no-console': 'warn',
    'antfu/if-newline': 'off',
  },
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      }
    }
  ]
}
