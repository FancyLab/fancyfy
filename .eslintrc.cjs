/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'fancyfy/ds/generated/',
    '.fancyfy-logs/',
    '*.cjs',
  ],
  rules: {
    // ADR-007: all logging through fancyfy/shared/logger — never console.*
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='console']",
        message: "Use createLogger() from '@fancyfy/shared/logger' instead of console.*",
      },
    ],
    // ADR-010: cssVar() helper required — no inline 'var(--...)' strings in TS
    'no-restricted-properties': 'off',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      // Allow console.* inside the logger module itself
      files: ['fancyfy/shared/logger.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      // CLI and Vite plugin run in Node context; console is fine there
      files: ['fancyfy/cli/**/*.ts', 'vite.config.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
};
