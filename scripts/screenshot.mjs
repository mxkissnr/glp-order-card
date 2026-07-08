#!/usr/bin/env node
// Regenerates docs/screenshots/card.png for the README. Boots a throwaway
// http.createServer serving this repo's root (so glp-order-card.js can be
// loaded without file:// CORS issues) plus a harness page, spins up a
// headless Chromium via Playwright, mocks every api/orders/* endpoint the
// card fetches on load with realistic demo data (a 5-item menu incl. a
// bean-library drink, trending/NEW badges, an empty order queue), drives
// the card into a populated "variant selected + bean info shown" state,
// and screenshots just the <glp-order-card> element.
//
// Run: node scripts/screenshot.mjs
// Requires: npm install --save-dev playwright && npx playwright install chromium

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.join(__dirname, '..');
const outDir    = path.join(repoRoot, 'docs', 'screenshots');
const outFile   = path.join(outDir, 'card.png');

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };

const HARNESS_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: #000; }
  body { display: flex; padding: 40px; }
  glp-order-card { display: block; width: 360px; }
</style>
</head>
<body>
<script src="/glp-order-card.js"></script>
<script>
  const el = document.createElement('glp-order-card');
  el.setConfig({
    glp_url: window.location.origin,
    glp_token: 'dummy-token',
    switch_entity: 'switch.espresso_plug',
    title: 'Bestellen',
  });
  el.hass = {
    states: {
      'switch.espresso_plug': { state: 'on', attributes: {} },
    },
    user: { id: 'demo-user', name: 'Max' },
    callService: () => {},
  };
  document.body.appendChild(el);
  window.__card = el;
</script>
</body>
</html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    if (urlPath === '/__harness.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HARNESS_HTML);
      return;
    }
    const filePath = path.join(repoRoot, decodeURIComponent(urlPath));
    if (!filePath.startsWith(repoRoot)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ── Demo data ──────────────────────────────────────────────────────────
const now = Date.now();

const MENU = [
  { name: 'Espresso',        emoji: '☕', trending: true, createdAt: now - 90 * 86400000 },
  { name: 'Cappuccino',      emoji: '🥛', createdAt: now - 3 * 86400000 }, // < 7d -> NEW badge
  { name: 'Flat White',      emoji: '☁️', variants: ['Single', 'Doppio'], createdAt: now - 60 * 86400000 },
  { name: 'Latte Macchiato', emoji: '🍮', createdAt: now - 120 * 86400000 },
  { name: 'Filterkaffee',    emoji: '🫖', useBeans: true, createdAt: now - 45 * 86400000 },
];

const SETTINGS   = { enabled: true };
const QUEUE_ETA  = { positions: {} };

const ACTIVE_BEANS = [
  { name: 'Yirgacheffe Chelelektu', origin: 'ET', variety: 'Heirloom', process: 'Washed', notes: 'Blumig, Zitrone, Bergamotte', decaf: false },
  { name: 'Bombe', origin: 'BR', variety: 'Bourbon, Catuai', process: 'Natural', notes: 'Schokolade, Nougat, Karamell', decaf: false },
];

async function mockApi(page) {
  await page.route('**/api/orders/menu', route => route.fulfill({ json: MENU }));
  await page.route('**/api/orders/settings', route => route.fulfill({ json: SETTINGS }));
  await page.route('**/api/orders/queue-eta', route => route.fulfill({ json: QUEUE_ETA }));
  await page.route('**/api/orders/active-beans', route => route.fulfill({ json: ACTIVE_BEANS }));
  await page.route('**/api/orders/mine**', route => route.fulfill({ json: [] }));
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const server = await startServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 500, height: 700 } });
  await mockApi(page);
  await page.goto(`${baseUrl}/__harness.html`);

  // Wait for the menu grid to actually render inside the shadow DOM.
  await page.waitForFunction(() => {
    const el = document.querySelector('glp-order-card');
    return !!el?.shadowRoot?.querySelector('.menu-grid');
  }, { timeout: 10000 });

  // ha-card is a real HA-provided custom element inside Lovelace; here it's
  // undefined (inline by default), which pads the screenshot — force block
  // layout inside the shadow root to match production sizing.
  await page.evaluate(() => {
    const el = document.querySelector('glp-order-card');
    const style = document.createElement('style');
    style.textContent = 'ha-card { display: block; }';
    el.shadowRoot.appendChild(style);
  });

  // Select the bean-library item + a variant so the demo shows off the
  // richer UI (variant chips, bean info box, enabled order button) rather
  // than just the bare menu grid.
  await page.evaluate(() => {
    const el = document.querySelector('glp-order-card');
    const item = [...el.shadowRoot.querySelectorAll('.menu-item')]
      .find(m => m.dataset.item === 'Filterkaffee');
    item?.click();
  });
  await page.waitForFunction(() => {
    const el = document.querySelector('glp-order-card');
    return !!el?.shadowRoot?.querySelector('.variant-chip');
  }, { timeout: 5000 });
  await page.evaluate(() => {
    const el = document.querySelector('glp-order-card');
    const chip = el.shadowRoot.querySelector('.variant-chip');
    chip?.click();
  });
  await page.waitForFunction(() => {
    const el = document.querySelector('glp-order-card');
    return !!el?.shadowRoot?.querySelector('#oc-bean-info');
  }, { timeout: 5000 });

  await page.waitForTimeout(300); // let hover/transition state settle

  const card = page.locator('glp-order-card');
  await card.screenshot({ path: outFile });

  await browser.close();
  server.close();
  console.log(`Screenshot written to ${outFile}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
