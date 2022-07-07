module.exports = {
  root: true,
  plugins: ['solid', 'prettier'],
  extends: ['@antfu/eslint-config-ts', 'plugin:solid/typescript', 'prettier'],
  ignorePatterns: ['**/node_modules', '**/dist', 'generated'],
  rules: {
    'no-console': 'warn',
    'antfu/if-newline': 'off',
  }
}
