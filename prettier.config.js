/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
};

module.exports = config;
