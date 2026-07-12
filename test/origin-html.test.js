// Loads the real glp-order-card.js source into a sandboxed vm context (same
// approach as security-helpers.test.js) and exercises the real _originHtml()
// function shipped in the card, not a re-implementation. Covers #28: origins[]
// (blend beans, multiple countries) rendering alongside the legacy
// single-origin fallback.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCardHelpers() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'glp-order-card.js'), 'utf8');

  class HTMLElement {}

  const context = {
    HTMLElement,
    customElements: { define() {} },
    window: {},
    console,
    URL,
    Intl,
    navigator: { language: 'en-US' },
  };
  vm.createContext(context);
  vm.runInContext(src, context, { filename: 'glp-order-card.js' });

  return { originHtml: context._originHtml };
}

const { originHtml } = loadCardHelpers();

test('_originHtml() renders a single ISO code as flag + localized name', () => {
  assert.equal(originHtml([{ code: 'BR' }], 'en'), '🇧🇷 Brazil');
});

test('_originHtml() renders a blend of multiple origins joined with " + "', () => {
  const html = originHtml([{ code: 'BR', percent: 60 }, { code: 'CO', percent: 40 }], 'en');
  assert.equal(html, '🇧🇷 Brazil 60% + 🇨🇴 Colombia 40%');
});

test('_originHtml() omits the percent when not set', () => {
  assert.equal(originHtml([{ code: 'BR' }, { code: 'CO' }], 'en'), '🇧🇷 Brazil + 🇨🇴 Colombia');
});

test('_originHtml() renders legacy free-text origin values as-is (pre-1.96 data)', () => {
  assert.equal(originHtml([{ code: 'Kuba' }], 'en'), 'Kuba');
});

test('_originHtml() escapes a non-ISO origin string to prevent HTML injection', () => {
  const html = originHtml([{ code: '<script>alert(1)</script>' }], 'en');
  assert.ok(!html.includes('<script>'));
});

test('_originHtml() localizes the country name per requested language', () => {
  assert.equal(originHtml([{ code: 'BR' }], 'de'), '🇧🇷 Brasilien');
});

test('_originHtml() returns an empty string for an empty origins array', () => {
  assert.equal(originHtml([], 'en'), '');
});
