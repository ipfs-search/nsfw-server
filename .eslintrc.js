module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': 'off',
    'max-len': [
      'warn', {
        code: 100,
        ignoreUrls: true,
      },
    ],
    'import/extensions': [
      'warn',
      'always',
      {
        js: 'never',
        ts: 'never',
        vue: 'never',
      },
    ],
  },
};
