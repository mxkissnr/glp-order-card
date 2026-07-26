// Proves _applySemanticColorContrast() actually RUNS and picks the correct
// --glp-ok/--glp-warn/--glp-err variant for a given resolved --glp-bg — not
// just that the method exists. Loads the real glp-order-card.js into a
// sandboxed vm context with a minimal fake DOM (style objects backed by a
// plain Map, no real CSS engine) sufficient to drive the method end-to-end:
// getComputedStyle(this).getPropertyValue('--glp-bg') reads back a
// pre-seeded value simulating what the real CSS cascade would have resolved,
// and the method's own this.style.setProperty(...) calls are inspected
// afterward. Real color normalization (hex/named-color -> rgb()) is exactly
// what the browser's engine does and is NOT re-implemented here — that layer
// is covered by scripts/screenshot.mjs's real Playwright renders instead;
// this test only proves the luminance-decision logic itself fires correctly.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeStyleStub() {
  const props = new Map();
  return {
    cssText: '',
    get color() { return props.get('color') || ''; },
    set color(v) { props.set('color', v); },
    setProperty(name, value) { props.set(name, value); },
    getPropertyValue(name) { return props.get(name) || ''; },
    _props: props,
  };
}

function loadCard() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'glp-order-card.js'), 'utf8');

  class HTMLElement {
    constructor() { this.style = makeStyleStub(); }
    attachShadow() {
      this.shadowRoot = {
        appendChild() {},
        innerHTML: '',
        getElementById() { return null; },
        querySelectorAll() { return []; },
      };
      return this.shadowRoot;
    }
  }

  const fakeDocument = {
    createElement() { return { style: makeStyleStub(), remove() {} }; },
  };

  // `class GlpOrderCard {}` is a lexical (let-like) declaration, so it never
  // becomes a property of the vm context's global object the way a
  // `function` declaration would — capture the real class reference via the
  // customElements.define() call the file makes at module top level instead.
  const registry = {};
  const context = {
    HTMLElement,
    customElements: { define(tag, cls) { registry[tag] = cls; } },
    window: {},
    document: fakeDocument,
    getComputedStyle(el) { return el.style; },
    console,
    URL,
    navigator: { language: 'en-US' },
  };
  vm.createContext(context);
  vm.runInContext(src, context, { filename: 'glp-order-card.js' });

  return registry['glp-order-card'];
}

const GlpOrderCard = loadCard();

test('_applySemanticColorContrast() picks the light-safe constants for a white --glp-bg', () => {
  const card = new GlpOrderCard();
  card.style.setProperty('--glp-bg', 'rgb(255, 255, 255)');
  card._applySemanticColorContrast();
  assert.equal(card.style.getPropertyValue('--glp-ok'), '#15803d');
  assert.equal(card.style.getPropertyValue('--glp-warn'), '#a16207');
  assert.equal(card.style.getPropertyValue('--glp-err'), '#dc2626');
});

test('_applySemanticColorContrast() picks the dark-safe constants for a near-black --glp-bg', () => {
  const card = new GlpOrderCard();
  card.style.setProperty('--glp-bg', 'rgb(24, 24, 27)');
  card._applySemanticColorContrast();
  assert.equal(card.style.getPropertyValue('--glp-ok'), '#22c55e');
  assert.equal(card.style.getPropertyValue('--glp-warn'), '#eab308');
  assert.equal(card.style.getPropertyValue('--glp-err'), '#ef4444');
});

test('_applySemanticColorContrast() is a no-op (does not throw) when --glp-bg is unset', () => {
  const card = new GlpOrderCard();
  assert.doesNotThrow(() => card._applySemanticColorContrast());
  assert.equal(card.style.getPropertyValue('--glp-ok'), '');
});
