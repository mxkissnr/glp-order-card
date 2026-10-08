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
    // #143. Until then the generated bundle it builds is linted as a stand-in,
    // and the innerHTML assignment gate also runs over src/ in CI
    // (`grep -nE "(inner|outer)HTML\s*=" src/*.ts`).
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
      globals: {
        ...globals.browser,
        // Lit's dev-mode global, referenced by the inlined runtime.
        litPropertyMetadata: 'readonly',
      },
    },
    rules: {
      ...commonRules,
      // The generated bundle is built from src/ with esbuild, which strips the
      // explanatory comment inside the source's otherwise-empty catch blocks —
      // making those catch bodies lint as empty. Allow empty catch here.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // The bundle now inlines Lit's pre-minified production runtime; these
      // rules cannot be meaningfully applied to its generated identifiers (and
      // esbuild renames are not ours to fix). Everything else still applies,
      // including the innerHTML review warning.
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'no-prototype-builtins': 'off',
    },
  },
];
