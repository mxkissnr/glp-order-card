// Lit-template escaping test (#143). Lit escapes every interpolated value
// before it reaches the DOM, so the manual _esc() calls that used to guard the
// innerHTML-built render no longer apply. This renders the order form with
// attacker-shaped data — a menu item name and a bean note — and proves both
// land as text, never as live elements.
//
// It runs in whichever real DOM the environment provides: happy-dom when it is
// installed (CI), otherwise the committed bundle in headless Chromium via
// Playwright, which the e2e harness already depends on. There is no skip path —
// the regression check always executes.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { loadCard } = require('./helpers/load-card.cjs');

const NAME_PAYLOAD = '<img src=x onerror=alert(1)>';
const NOTE_PAYLOAD = '<script>alert(1)</script>';

let Window;
try {
  ({ Window } = require('happy-dom'));
} catch {
  /* happy-dom is not installed in this dependency cache */
}

function isInstalled(id) {
  try {
    require.resolve(id);
    return true;
  } catch {
    return false;
  }
}

// The happy-dom path loads src/ and therefore the real `lit`; use it only when
// both are installed, otherwise render the committed bundle in Chromium.
if (Window && isInstalled('lit')) {
  // happy-dom path -----------------------------------------------------------
  // One Window for the whole file: node --test loads the card (and therefore
  // Lit) once per process, and Lit binds to whatever global document exists
  // when it is first imported. The window must be installed before loadCard().
  const window = new Window();
  // Publish `home-assistant` first so the card's deferred define (#145) fires
  // synchronously and registers `glp-order-card` in this window's registry.
  window.customElements.define('home-assistant', class extends window.HTMLElement {});
  loadCard({
    context: {
      document: window.document,
      window,
      HTMLElement: window.HTMLElement,
      customElements: window.customElements,
      navigator: window.navigator,
      getComputedStyle: window.getComputedStyle.bind(window),
    },
  });

  function makeCard() {
    // happy-dom forbids constructing its element classes with `new` directly,
    // so the card is built and upgraded through its custom-element registry.
    const card = window.document.createElement('glp-order-card');
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
} else {
  // Chromium path ------------------------------------------------------------
  // Reuses the committed bundle (which inlines Lit), so the check needs neither
  // `lit` nor `happy-dom` resolvable from node_modules.
  const { chromium } = require('playwright');
  const BUNDLE = path.join(__dirname, '..', 'glp-order-card.js');
  const HARNESS = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
<script>customElements.define('home-assistant', class extends HTMLElement {});</script>
<script src="/glp-order-card.js"></script>
</body></html>`;

  async function renderInChromium(opts) {
    const server = http.createServer((req, res) => {
      if (req.url === '/glp-order-card.js') {
        res.setHeader('content-type', 'text/javascript');
        res.end(fs.readFileSync(BUNDLE));
        return;
      }
      res.setHeader('content-type', 'text/html');
      res.end(HARNESS);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${port}/`);
      // This callback runs inside the browser tab, where document/HTMLElement/
      // customElements are real globals that ESLint cannot see.
      /* eslint-disable no-undef */
      return await page.evaluate((o) => {
        const el = document.createElement('glp-order-card');
        el._config = {};
        el._lang = 'en';
        el._enabled = true;
        el._menu = [{ name: o.name, variants: ['Single'] }, { name: 'Coffee', useBeans: true }];
        el._activeBeans = [{ id: 1, name: 'Ethiopia', notes: o.note }];
        el._selected = o.selected;
        el._selectedVariant = o.variant;
        el._selectedBeanId = o.beanId;
        document.body.appendChild(el);
        el._render();
        const root = el.shadowRoot;
        const submit = root.getElementById('oc-submit');
        return {
          imgs: root.querySelectorAll('img').length,
          scripts: root.querySelectorAll('script').length,
          text: root.textContent,
          submitDisabled: submit ? submit.disabled : null,
        };
      }, opts);
      /* eslint-enable no-undef */
    } finally {
      await browser.close();
      server.close();
    }
  }

  test('a menu item name and a bean note render as text, not as elements', async () => {
    const result = await renderInChromium({
      name: NAME_PAYLOAD, note: NOTE_PAYLOAD, selected: 'Coffee', variant: 'Ethiopia', beanId: 1,
    });
    assert.equal(result.imgs, 0, 'the menu item name must not become an <img> element');
    assert.equal(result.scripts, 0, 'the bean note must not become a <script> element');
    assert.ok(result.text.includes(NAME_PAYLOAD), 'the menu item name is preserved as text');
    assert.ok(result.text.includes(NOTE_PAYLOAD), 'the bean note is preserved as text');
  });

  test('the order-form submit button is disabled until an item and variant are selected', async () => {
    const result = await renderInChromium({
      name: 'Espresso', note: 'n', selected: null, variant: null, beanId: null,
    });
    assert.equal(result.submitDisabled, true);
  });
}
