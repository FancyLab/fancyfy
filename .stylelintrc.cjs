/* eslint-env node */
// Stylelint config for fancyfy SCSS.
// Enforces ADR-003 §7: no raw hex in sections, tokens via var(--...).
// The fcy/token-in-contract rule is documented but enforced via the
// Vite plugin / validate-contract script for now — a full custom plugin
// can be added later if noise grows.

module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-prettier/recommended'],
  customSyntax: 'postcss-scss',
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'fancyfy/ds/generated/**',
    'assets/**', // Horizon-owned compiled assets; not our business
  ],
  rules: {
    // Allow the fcy- prefix for custom properties (and any Horizon prefix)
    'custom-property-pattern': null,

    // ADR-003 §7: in section SCSS, disallow color/font literals.
    // Abstracts and utilities under fancyfy/ds/ can still declare them.
    'color-no-hex': [true, { severity: 'warning' }],
    'scss/dollar-variable-pattern': null,

    // Reasonable defaults
    'no-descending-specificity': null,
    'selector-class-pattern': '^[a-z]([a-z0-9]|-[a-z0-9]|__[a-z0-9]|--[a-z0-9])*$',
    'scss/at-rule-no-unknown': true,
    'at-rule-no-unknown': null,
  },
  overrides: [
    {
      // DS source files are allowed to declare primitives
      files: ['fancyfy/ds/**/*.scss'],
      rules: { 'color-no-hex': null },
    },
    {
      // Section SCSS files must never use hex — strict
      files: ['fancyfy/sections/**/*.scss'],
      rules: { 'color-no-hex': [true, { severity: 'error' }] },
    },
  ],
};
