/* global __dirname, console, URL */
// Shared test loader for the root glp-order-card.js bundle (#143). The card is a
// classic script wrapped in an IIFE, so its class and top-level helpers are not
// reachable from outside: the vm sandbox and the customElements.define anchor
// patch live here, so the build switch (esbuild rewrites the quote and the patch
// would silently stop matching) only has to update one place.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CARD_PATH = path.join(__dirname, '..', '..', 'glp-order-card.js');
const DEFINE_ANCHOR = "customElements.define('glp-order-card', GlpOrderCard);";

function loadCard({ expose = [], context = {} } = {}) {
  const src = fs.readFileSync(CARD_PATH, 'utf8');
  if (!src.includes(DEFINE_ANCHOR)) throw new Error(`load-card: anchor not found in ${CARD_PATH}: ${DEFINE_ANCHOR}`);

  const symbols = ['__GlpOrderCard', ...expose];
  const patched = src.replace(
    DEFINE_ANCHOR,
    `${DEFINE_ANCHOR} ${symbols.map((name) => `globalThis.${name} = ${name};`).join(' ')}`
  );

  class HTMLElement {}
  const sandbox = {
    HTMLElement,
    customElements: { define() {}, get() {}, whenDefined() { return new Promise(() => {}); } },
    window: {},
    console,
    URL,
    navigator: { language: 'en-US' },
    ...context,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(patched, sandbox, { filename: CARD_PATH });

  const result = { GlpOrderCard: sandbox.__GlpOrderCard };
  for (const name of expose) result[name] = sandbox[name];
  return result;
}

module.exports = { loadCard };
