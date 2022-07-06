module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 80,
  trailingComma: 'none',
  htmlWhitespaceSensitivity: 'ignore',
  pluginSearchDirs: ['.'],
  tailwindConfig: './packages/app/tailwind.config.cjs',
  plugins: [
    require('prettier-plugin-tailwindcss'),
    require('prettier-plugin-astro')
  ]
}
