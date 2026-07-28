// Minimal Playwright E2E smoke test (#48). Reuses the static-server/mock-API
// harness from scripts/e2e-harness.mjs (shared with scripts/screenshot.mjs)
// to render the real glp-order-card.js in a headless Chromium tab — not a
// vm sandbox — so it can exercise real DOM events and timing.
//
// Covers the one thing pure vm-sandboxed unit tests structurally cannot:
// the optimistic-UI guard (_clickBlocked/_pendingRender, set hass()) that
// protects an in-progress user selection from being wiped out by a
// concurrently-arriving `hass` update. Run via `npm test` (node --test
// auto-discovers test/**/*.test.mjs).
'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer, mockApi } from '../../scripts/e2e-harness.mjs';

const HARNESS_HTML = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
<script src="/glp-order-card.js"></script>
<script>
  const el = document.createElement('glp-order-card');
  el.setConfig({
    glp_url: window.location.origin,
    glp_token: 'dummy-token',
    switch_entity: 'switch.espresso_plug',
  });
  el.hass = {
    states: { 'switch.espresso_plug': { state: 'on', attributes: {} } },
    user: { id: 'demo-user', name: 'Max' },
    callService: () => {},
  };
  document.body.appendChild(el);
  window.__card = el;
</script>
</body></html>`;

const MENU = [{ name: 'Flat White', variants: ['Single', 'Doppio'] }];

// The page.evaluate()/waitForFunction() callbacks below run inside the
// browser tab via Playwright, not in this Node process — `document`/`Event`
// are real globals there, even though ESLint's static analysis (correctly,
// for a Node test file) doesn't know that.
/* eslint-disable no-undef */

async function setUpCard() {
  const server = await startServer(HARNESS_HTML);
  const { port } = server.address();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await mockApi(page, { menu: MENU });
  await page.goto(`http://127.0.0.1:${port}/__harness.html`);
  await page.waitForFunction(() => {
    const el = document.querySelector('glp-order-card');
    return !!el?.shadowRoot?.querySelector('.menu-grid');
  }, { timeout: 10000 });
  return { server, browser, page };
}

async function tearDown({ server, browser }) {
  await browser.close();
  server.close();
}

test('order button becomes enabled after selecting an item + variant', async () => {
  const ctx = await setUpCard();
  const { page } = ctx;
  try {
    await page.evaluate(() => {
      document.querySelector('glp-order-card').shadowRoot
        .querySelector('.menu-item[data-item="Flat White"]').click();
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('glp-order-card');
      return !!el?.shadowRoot?.querySelector('.variant-chip');
    }, { timeout: 5000 });

    const submitDisabledBefore = await page.evaluate(() =>
      document.querySelector('glp-order-card').shadowRoot.getElementById('oc-submit').disabled);
    assert.equal(submitDisabledBefore, true, 'submit stays disabled until a variant is picked');

    await page.evaluate(() => {
      document.querySelector('glp-order-card').shadowRoot.querySelector('.variant-chip').click();
    });

    const submit = await page.evaluate(() => {
      const btn = document.querySelector('glp-order-card').shadowRoot.getElementById('oc-submit');
      return { disabled: btn.disabled, text: btn.textContent };
    });
    assert.equal(submit.disabled, false);
    assert.match(submit.text, /Single/);
  } finally {
    await tearDown(ctx);
  }
});

test('a concurrent hass update does not reset an in-progress variant selection', async () => {
  const ctx = await setUpCard();
  const { page } = ctx;
  try {
    await page.evaluate(() => {
      document.querySelector('glp-order-card').shadowRoot
        .querySelector('.menu-item[data-item="Flat White"]').click();
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('glp-order-card');
      return !!el?.shadowRoot?.querySelector('.variant-chip');
    }, { timeout: 5000 });

    // Simulate the race the _clickBlocked guard exists for: a `hass` push
    // arrives between pointerdown (which sets _clickBlocked, blocking any
    // render from tearing down the DOM mid-click) and the click itself.
    await page.evaluate(() => {
      const el = document.querySelector('glp-order-card');
      const chip = el.shadowRoot.querySelector('.variant-chip');
      chip.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      // Fresh object reference simulating a real hass push mid-interaction
      // (glp-order-card exposes `hass` as a setter only, so this can't read
      // back the current value — reconstruct it instead).
      el.hass = {
        states: { 'switch.espresso_plug': { state: 'on', attributes: {} } },
        user: { id: 'demo-user', name: 'Max' },
        callService: () => {},
      };
      chip.click();
    });

    // Wait past both the 300ms click-block window and the 1s hass-render
    // debounce so any deferred/eventual re-render has had a chance to fire.
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      const el = document.querySelector('glp-order-card');
      const chip = el.shadowRoot.querySelector('.variant-chip');
      const btn = el.shadowRoot.getElementById('oc-submit');
      return { chipSelected: chip.classList.contains('selected'), selectedVariant: el._selectedVariant, btnDisabled: btn.disabled };
    });

    assert.equal(state.selectedVariant, 'Single');
    assert.equal(state.chipSelected, true);
    assert.equal(state.btnDisabled, false);
  } finally {
    await tearDown(ctx);
  }
});
/* eslint-enable no-undef */
