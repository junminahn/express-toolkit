module.exports = {
  extends: ['airbnb-typescript/base', 'prettier'],
  env: { es6: true, browser: true, node: false },
  plugins: ['import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    createDefaultProgram: true,
  },
  root: true,
  rules: {},
  overrides: [],
};
