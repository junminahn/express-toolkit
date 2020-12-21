module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: { es6: true, commonjs: true, node: true, jest: true },
  plugins: [],
  parserOptions: {
    ecmaVersion: 6,
  },
  root: true,
  rules: {
    'import/no-extraneous-dependencies': 0,
    'prefer-arrow-callback': 0,
    'func-names': 0,
    'no-underscore-dangle': 0,
    'global-require': 0,
    'prefer-spread': 0,
    'prefer-rest-params': 0,
    'object-shorthand': 0,
    'max-classes-per-file': 0,
    'no-param-reassign': 0,
    'no-use-before-define': 0,
  },
  overrides: [],
};
