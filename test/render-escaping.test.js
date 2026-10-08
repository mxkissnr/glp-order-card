// Lit-template escaping test (#143). Lit escapes every interpolated value
// before it reaches the DOM, so the manual _esc() calls that used to guard the
// innerHTML-built render no longer apply. This renders the order form into a
// real DOM (happy-dom) with attacker-shaped data — a menu item name and a bean
// note — and proves both land as text, never as live elements.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Window } = require('happy-dom');
const { loadCard } = require('./helpers/load-card.cjs');

const NAME_PAYLOAD = '<img src=x onerror=alert(1)>';
const NOTE_PAYLOAD = '<script>alert(1)</script>';

function makeCard() {
  // A fresh happy-dom Window per call; its globals are installed before the
  // card module (and therefore Lit) is first required, so Lit binds to a real
  // document for render().
  const window = new Window();
  const { GlpOrderCard } = loadCard({
    context: {
      document: window.document,
      window,
      HTMLElement: window.HTMLElement,
      customElements: window.customElements,
      navigator: window.navigator,
      getComputedStyle: window.getComputedStyle.bind(window),
    },
  });

  const card = new GlpOrderCard();
  card._config = {};
  card._lang = 'en';
  card._enabled = true;
  card._menu = [
    { name: NAME_PAYLOAD, variants: ['Single'] },
    { name: 'Coffee', useBeans: true },
  ];
  card._activeBeans = [{ id: 1, name: 'Ethiopia', notes: NOTE_PAYLOAD }];
  card._selected = 'Coffee';
  card._selectedVariant = 'Ethiopia';
  card._selectedBeanId = 1;
  return card;
}

test('a menu item name and a bean note render as text, not as elements', () => {
  const card = makeCard();
  card._render();

  const root = card.shadowRoot;
  assert.equal(root.querySelector('img'), null, 'the menu item name must not become an <img> element');
  assert.equal(root.querySelector('script'), null, 'the bean note must not become a <script> element');
  assert.ok(root.textContent.includes(NAME_PAYLOAD), 'the menu item name is preserved as text');
  assert.ok(root.textContent.includes(NOTE_PAYLOAD), 'the bean note is preserved as text');
});

test('the order-form submit button is disabled until an item and variant are selected', () => {
  const card = makeCard();
  card._selected = null;
  card._selectedVariant = null;
  card._render();

  const btn = card.shadowRoot.getElementById('oc-submit');
  assert.equal(btn.disabled, true);
});
