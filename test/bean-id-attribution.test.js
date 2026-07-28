// Order->bean attribution id-first resolution (#35, follow-up to
// gaggiuino-local-profiler#456). Loads the real glp-order-card.js into a
// sandboxed vm context (same approach as machine-config.test.js) and
// exercises _getSelectedBean() directly.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGlpOrderCard() {
  let src = fs.readFileSync(path.join(__dirname, '..', 'glp-order-card.js'), 'utf8');
  src = src.replace(
    "customElements.define('glp-order-card', GlpOrderCard);",
    "customElements.define('glp-order-card', GlpOrderCard); globalThis.__GlpOrderCard = GlpOrderCard;"
  );

  class HTMLElement {}
  const context = {
    HTMLElement, customElements: { define() {} }, window: {}, console, URL,
    navigator: { language: 'en-US' },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(src, context, { filename: path.join(__dirname, '..', 'glp-order-card.js') });
  return context.__GlpOrderCard;
}

const GlpOrderCard = loadGlpOrderCard();

function makeInstance({ menu, activeBeans, selected, selectedVariant, selectedBeanId }) {
  const inst = Object.create(GlpOrderCard.prototype);
  inst._menu = menu;
  inst._activeBeans = activeBeans;
  inst._selected = selected;
  inst._selectedVariant = selectedVariant;
  inst._selectedBeanId = selectedBeanId ?? null;
  return inst;
}

const beanItem = { name: 'Coffee', useBeans: true };

test('_getSelectedBean() resolves by id even when another bean now shares the selected label', () => {
  const inst = makeInstance({
    menu: [beanItem],
    selected: 'Coffee',
    selectedVariant: 'Ethiopia',
    selectedBeanId: 1,
    activeBeans: [
      { id: 2, name: 'Ethiopia' },      // reimported under the same name, different id
      { id: 1, name: 'Kenya' },         // stale label locally, but id still resolves
    ],
  });
  assert.equal(inst._getSelectedBean().id, 1);
});

test('_getSelectedBean() falls back to name matching when the id is absent (pre-#35 state)', () => {
  const inst = makeInstance({
    menu: [beanItem],
    selected: 'Coffee',
    selectedVariant: 'Ethiopia',
    selectedBeanId: null,
    activeBeans: [{ id: 5, name: 'Ethiopia' }],
  });
  assert.equal(inst._getSelectedBean().id, 5);
});

test('_getSelectedBean() falls back to name matching when the id no longer resolves', () => {
  const inst = makeInstance({
    menu: [beanItem],
    selected: 'Coffee',
    selectedVariant: 'Ethiopia',
    selectedBeanId: 999, // stale/unresolvable id
    activeBeans: [{ id: 5, name: 'Ethiopia' }],
  });
  assert.equal(inst._getSelectedBean().id, 5);
});

test('_getSelectedBean() returns null for non-bean items regardless of selectedBeanId', () => {
  const inst = makeInstance({
    menu: [{ name: 'Espresso', useBeans: false, variants: ['Single', 'Double'] }],
    selected: 'Espresso',
    selectedVariant: 'Single',
    selectedBeanId: 1,
    activeBeans: [{ id: 1, name: 'Ethiopia' }],
  });
  assert.equal(inst._getSelectedBean(), null);
});

test('_beanIdForLabel() resolves the active bean id for a rendered chip label', () => {
  const inst = makeInstance({
    activeBeans: [
      { id: 7, name: 'House Blend' },
      { id: 8, name: 'Ethiopia', decaf: true },
    ],
  });
  assert.equal(inst._beanIdForLabel('House Blend'), 7);
  assert.equal(inst._beanIdForLabel('Ethiopia · Decaf'), 8);
  assert.equal(inst._beanIdForLabel('Unknown'), null);
});
