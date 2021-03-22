module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: { es6: true, commonjs: true, node: true, jest: true },
  plugins: [],
  parserOptions: {
    ecmaVersion: 6,
  },
  root: true,
  rules: {
    'arrow-body-style': 0,
    'import/no-extraneous-dependencies': 0,
    'prefer-arrow-callback': 0,
    'func-names': 0,
    'no-underscore-dangle': 0,
    'no-console': 0,
    'no-shadow': 0,
    'no-unused-vars': 0,
    'no-prototype-builtins': 0,
    'global-require': 0,
    'prefer-spread': 0,
    'prefer-object-spread': 0,
    'prefer-rest-params': 0,
    'prefer-destructuring': 0,
    'object-shorthand': 0,
    'max-classes-per-file': 0,
    'no-param-reassign': 0,
    'no-use-before-define': 0,
    'import/no-dynamic-require': 0,
  },
  overrides: [],
};
