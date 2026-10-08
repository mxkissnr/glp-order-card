// Shared test loader for the card source (#143). The card ships as a classic
// script bundled into an IIFE, so its class and top-level helpers are not
// reachable from the page; the tests instead import them straight from
// src/glp-order-card.ts, which Node loads via native type stripping. The module
// is evaluated once per test process, so every test file calls loadCard() once.
//
// The pipeline's dependency cache carries only the base devDependencies, so a
// freshly added package (`lit`) can be missing there even though the lockfile
// pins it. Registering a resolve hook that falls back to a local stub keeps the
// source import working; the hook prefers the real package, so CI uses it.
'use strict';

const { register } = require('node:module');
const { pathToFileURL } = require('node:url');

register('./lit-resolve-hook.mjs', pathToFileURL(__filename).href);

function loadCard({ expose = [], context = {} } = {}) {
  const stubs = {
    HTMLElement: class HTMLElement {},
    customElements: { define() {}, get() {}, whenDefined() { return new Promise(() => {}); } },
    window: {},
    navigator: { language: 'en-US' },
    ...context,
  };
  // defineProperty, not assignment: Node already defines `navigator` as a
  // getter-only global, so a plain `globalThis.navigator = ...` would throw.
  for (const [name, value] of Object.entries(stubs)) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }

  const mod = require('../../src/glp-order-card.ts');
  const result = { GlpOrderCard: mod.GlpOrderCard };
  for (const name of expose) result[name] = mod[name];
  return result;
}

module.exports = { loadCard };
