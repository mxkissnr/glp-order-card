// Multi-machine `machine` config option tests (#29). Loads the real
// glp-order-card.js into a sandboxed vm context (same approach as
// security-helpers.test.js) and exposes the GlpOrderCard class via a
// test-only source patch (a top-level `class` declaration doesn't become a
// context property on its own) so _findMachineStatusEntity()/
// _getSwitchEntity() can be exercised directly.
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
  vm.runInContext(src, context, { filename: 'glp-order-card.js' });
  return context.__GlpOrderCard;
}

const GlpOrderCard = loadGlpOrderCard();

function makeInstance({ config, states }) {
  const inst = Object.create(GlpOrderCard.prototype);
  inst._config = config;
  inst._hass = states ? { states } : null;
  return inst;
}

test('_findMachineStatusEntity() without `machine` keeps the existing behavior (first entity found)', () => {
  const inst = makeInstance({
    config: {},
    states: {
      'sensor.gaggiuino_local_profiler_machine_status': { attributes: { friendly_name: 'Gaggiuino Machine Status' } },
    },
  });
  assert.equal(inst._findMachineStatusEntity(), 'sensor.gaggiuino_local_profiler_machine_status');
});

test('_findMachineStatusEntity() with `machine` matches the entity whose friendly_name references it', () => {
  const inst = makeInstance({
    config: { machine: 'Kitchen GaggiMate' },
    states: {
      'sensor.gaggiuino_local_profiler_machine_status': { attributes: { friendly_name: 'Gaggiuino Machine Status' } },
      'sensor.kitchen_gaggimate_machine_status': { attributes: { friendly_name: 'Kitchen GaggiMate Machine Status' } },
    },
  });
  assert.equal(inst._findMachineStatusEntity(), 'sensor.kitchen_gaggimate_machine_status');
});

test('_getSwitchEntity() prefers explicit switch_entity config over machine-based lookup', () => {
  const inst = makeInstance({
    config: { switch_entity: 'switch.explicit', machine: 'Kitchen GaggiMate' },
    states: {
      'sensor.kitchen_gaggimate_machine_status': { attributes: { switch_entity: 'switch.from_entity' } },
    },
  });
  assert.equal(inst._getSwitchEntity(), 'switch.explicit');
});

test('_getSwitchEntity() falls back to the machine-matched entity\'s switch_entity attribute', () => {
  const inst = makeInstance({
    config: { machine: 'Kitchen GaggiMate' },
    states: {
      'sensor.gaggiuino_local_profiler_machine_status': { attributes: { switch_entity: 'switch.default' } },
      'sensor.kitchen_gaggimate_machine_status': { attributes: { switch_entity: 'switch.kitchen' } },
    },
  });
  assert.equal(inst._getSwitchEntity(), 'switch.kitchen');
});

test('_findMachineStatusEntity() returns null without hass (no crash before first render)', () => {
  const inst = makeInstance({ config: { machine: 'Kitchen GaggiMate' }, states: null });
  assert.equal(inst._findMachineStatusEntity(), null);
});
