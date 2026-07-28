// Bean speciality/normal grouping tests (#36). Loads the real
// glp-order-card.js into a sandboxed vm context (same approach as
// machine-config.test.js) and exposes the GlpOrderCard class via a
// test-only source patch so _getVariantsGrouped() can be exercised directly.
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

function makeInstance({ activeBeans } = {}) {
  const inst = Object.create(GlpOrderCard.prototype);
  inst._activeBeans = activeBeans;
  return inst;
}

// Arrays/objects returned from the vm-sandboxed module live in a different
// realm than this test file's own Array/Object, which makes assert.deepEqual
// (strict, prototype-sensitive) report false mismatches even on identical
// values. Round-tripping through JSON normalizes both sides to this realm's
// plain objects.
function plain(x) { return JSON.parse(JSON.stringify(x)); }

test('_getVariantsGrouped() returns a flat list for non-bean items (no category concept)', () => {
  const inst = makeInstance({ activeBeans: [{ name: 'Ethiopia', category: 'speciality' }] });
  const result = inst._getVariantsGrouped({ variants: ['Single', 'Double'] });
  assert.deepEqual(plain(result), { flat: ['Single', 'Double'] });
});

test('_getVariantsGrouped() returns a flat empty list for a null/undefined item', () => {
  const inst = makeInstance({ activeBeans: [] });
  assert.deepEqual(plain(inst._getVariantsGrouped(null)), { flat: [] });
  assert.deepEqual(plain(inst._getVariantsGrouped(undefined)), { flat: [] });
});

test('_getVariantsGrouped() splits bean-backed items into speciality/normal by category', () => {
  const inst = makeInstance({
    activeBeans: [
      { name: 'Ethiopia Yirgacheffe', category: 'speciality' },
      { name: 'House Blend', category: 'normal' },
      { name: 'Colombia Supremo' }, // untagged → defaults to normal
    ],
  });
  const result = inst._getVariantsGrouped({ useBeans: true });
  assert.deepEqual(plain(result), {
    speciality: ['Ethiopia Yirgacheffe'],
    normal: ['House Blend', 'Colombia Supremo'],
  });
});

test('_getVariantsGrouped() applies the decaf label suffix within each group', () => {
  const inst = makeInstance({
    activeBeans: [
      { name: 'Ethiopia', category: 'speciality', decaf: true },
      { name: 'House Blend', category: 'normal' },
    ],
  });
  const result = inst._getVariantsGrouped({ useBeans: true });
  assert.deepEqual(plain(result.speciality), ['Ethiopia · Decaf']);
  assert.deepEqual(plain(result.normal), ['House Blend']);
});

test('_getVariantsGrouped() handles a bean-backed item with no active beans', () => {
  const inst = makeInstance({ activeBeans: [] });
  const result = inst._getVariantsGrouped({ useBeans: true });
  assert.deepEqual(plain(result), { speciality: [], normal: [] });
});

test('_getVariantsGrouped() treats all-untagged beans as entirely normal (pre-#505 data)', () => {
  const inst = makeInstance({
    activeBeans: [{ name: 'Blend A' }, { name: 'Blend B' }],
  });
  const result = inst._getVariantsGrouped({ useBeans: true });
  assert.deepEqual(plain(result), { speciality: [], normal: ['Blend A', 'Blend B'] });
});
