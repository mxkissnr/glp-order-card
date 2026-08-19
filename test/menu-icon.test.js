// Loads the real glp-order-card.js source into a sandboxed vm context (same
// approach as origin-html.test.js) and exercises the real _menuIconHtml()
// function shipped in the card, not a re-implementation. Covers #90: the
// six known DEFAULT_MENU drink ids get a drawn icon, any other id (a
// user-created menu entry, POST/PUT api/orders/menu) falls back to that
// entry's own persisted `emoji` field — which stays a stored field, never
// migrated or rewritten by this change.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCardHelpers() {
  let src = fs.readFileSync(path.join(__dirname, '..', 'glp-order-card.js'), 'utf8');
  // #114: glp-order-card.js is wrapped in an IIFE (see security-helpers.test.js).
  src = src.replace(
    "customElements.define('glp-order-card', GlpOrderCard);",
    "customElements.define('glp-order-card', GlpOrderCard); globalThis._menuIconHtml = _menuIconHtml;"
  );

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
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(src, context, { filename: path.join(__dirname, '..', 'glp-order-card.js') });

  return { menuIconHtml: context._menuIconHtml };
}

const { menuIconHtml } = loadCardHelpers();

test('_menuIconHtml() renders a drawn SVG icon for each of the six known drink ids', () => {
  for (const id of ['espresso', 'ristretto', 'lungo', 'cappuccino', 'latte', 'flat_white']) {
    const html = menuIconHtml({ id, name: id, emoji: '☕' });
    assert.match(html, /^<svg class="glp-i"/);
    assert.ok(!html.includes('☕'), `${id} icon should not fall back to the stored emoji`);
  }
});

test('_menuIconHtml() falls back to the stored emoji for a custom (user-created) menu entry', () => {
  // Server always mints custom ids as `m_${Date.now()}` (routes/orders.js),
  // which can never collide with the six known drink ids.
  const html = menuIconHtml({ id: 'm_1723000000000', name: 'Affogato', emoji: '🍮' });
  assert.equal(html, '🍮');
});

test('_menuIconHtml() escapes the stored emoji fallback (defense in depth alongside server-side sanitizeEmoji())', () => {
  const html = menuIconHtml({ id: 'm_1', name: 'x', emoji: '<img src=x onerror=alert(1)>' });
  assert.ok(!html.includes('<img'));
});

test('_menuIconHtml() renders nothing broken for an entry with neither a known id nor a stored emoji', () => {
  assert.equal(menuIconHtml({ id: 'm_2', name: 'Mystery' }), '');
  assert.equal(menuIconHtml(undefined), '');
});
