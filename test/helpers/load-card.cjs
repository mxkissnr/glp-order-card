// Shared test loader for the card (#143). The card ships as a classic script
// bundled into an IIFE, so its class and top-level helpers are not reachable
// from the page; the tests instead import them straight from
// src/glp-order-card.ts, which Node loads via native type stripping. The module
// is evaluated once per test process, so every test file calls loadCard() once.
//
// The release pipeline type-checks/lints/tests against a dependency cache that
// carries only the base devDependencies, so a freshly added package (`lit`) can
// be missing there even though the lockfile pins it. When the source import
// fails for that reason, fall back to the committed bundle: it inlines Lit, so
// the same class and helpers stay reachable without resolving `lit`. The
// fallback mirrors the shipped artefact byte-for-byte and is never used when
// the dependency is installed.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BUNDLE_PATH = path.join(__dirname, '..', '..', 'glp-order-card.js');
let bundleExports = null;

function loadBundle() {
  if (!bundleExports) {
    vm.runInThisContext(fs.readFileSync(BUNDLE_PATH, 'utf8'), { filename: BUNDLE_PATH });
    bundleExports = globalThis.GlpOrderCardModule;
  }
  return bundleExports;
}

function loadCard({ expose = [], context = {} } = {}) {
  const stubs = {
    HTMLElement: class HTMLElement {},
    customElements: { define() {}, get() {}, whenDefined() { return new Promise(() => {}); } },
    window: {},
    navigator: { language: 'en-US' },
    // The bundle inlines Lit's browser build, whose runtime reads
    // document.createTreeWalker as it loads; nothing renders unless a test
    // supplies a real DOM.
    document: { createTreeWalker() { return {}; } },
    ...context,
  };
  // defineProperty, not assignment: Node already defines `navigator` as a
  // getter-only global, so a plain `globalThis.navigator = ...` would throw.
  for (const [name, value] of Object.entries(stubs)) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }

  let mod;
  try {
    mod = require('../../src/glp-order-card.ts');
  } catch (err) {
    if (err && err.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    mod = loadBundle();
  }
  const result = { GlpOrderCard: mod.GlpOrderCard };
  for (const name of expose) result[name] = mod[name];
  return result;
}

module.exports = { loadCard };
