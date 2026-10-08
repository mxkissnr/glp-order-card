const js = require('@eslint/js');
const globals = require('globals');

const commonRules = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-undef': 'error',
  'require-atomic-updates': 'error',
  'no-implicit-globals': 'error',
  'no-restricted-properties': [
    'warn',
    { property: 'innerHTML', message: 'innerHTML use flagged for review (XSS risk) — warning only, not blocking.' },
  ],
};

module.exports = [
  {
    // glp-order-card.js is generated from src/ by esbuild and now inlines the
    // Lit runtime, whose minified third-party code cannot be meaningfully
    // linted. TS-aware linting of src/ follows in a later slice of #143; until
    // then the innerHTML assignment gate lives in the build/CI checks
    // (`grep -nE "(inner|outer)HTML\s*=" src/*.ts`). docs/ and graphify-out/
    // are generated artifacts too.
    ignores: ['node_modules/**', 'docs/**', 'graphify-out/**', 'src/**', 'glp-order-card.js'],
  },
  js.configs.recommended,
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: commonRules,
  },
  {
    files: ['test/**/*.js', 'test/**/*.mjs', 'test/helpers/**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: commonRules,
  },
];
