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
    // src/** is TypeScript; TS-aware linting of it follows in a later slice of
    // #143. For now only the generated bundle it builds is linted.
    ignores: ['node_modules/**', 'docs/**', 'graphify-out/**', 'src/**'],
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
  {
    files: ['glp-order-card.js'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...commonRules,
      // The generated bundle is built from src/ with esbuild, which strips the
      // explanatory comment inside the source's otherwise-empty catch blocks —
      // making those catch bodies lint as empty. Allow empty catch here.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
