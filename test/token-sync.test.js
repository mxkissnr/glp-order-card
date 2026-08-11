// Consistency check for JS blocks intentionally kept byte-identical between
// this repo and glp-card.js — originally just the GLP-TOKENS CSS block,
// extended (#83) to the full set of GLP-SHARED helpers glp-card.js has
// grown markers for over time (esc/safeUrl, theme-presets, machine-icon,
// the machine-status matching predicate, app-theme-lookup, contrast):
// this repo used to only ever check GLP-TOKENS, and a missing marker on the
// neighbor's side used to always skip instead of fail, so the guard
// verified far less than it looked like it did.
//
// "Neighbor repo not checked out" is a normal, expected state for local dev
// (skip) but not for CI, which is expected to fetch the neighbor file (see
// .github/workflows/validate.yml) — there, its absence means that fetch
// step is broken and this fails instead of silently skipping. A marker
// missing on the neighbor's side is no longer a legitimate transitional
// state now that both sides carry every marker in BLOCKS — it fails, the
// same as a byte-level drift would.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Overridable so CI can point this at wherever it fetches the neighbor
// file, without disturbing the local-dev default (a sibling checkout under
// ~/Dokumente/Projekte/glp-project, per this machine's layout).
const NEIGHBOR_PATH = process.env.GLP_LOVELACE_CARD_PATH
  || path.join(os.homedir(), 'Dokumente', 'Projekte', 'glp-project', 'glp-lovelace-card', 'glp-card.js');

const IN_CI = !!process.env.CI;

const OWN_SRC = fs.readFileSync(path.join(__dirname, '..', 'glp-order-card.js'), 'utf8');

// Anchored on a short, stable prefix rather than the full marker sentence —
// the marker's wording (it names both files) is itself part of the compared
// block and must stay identical too, but the search anchor shouldn't break
// if that wording is ever tweaked in lockstep on both sides.
const BLOCKS = [
  { name: 'GLP-TOKENS v1',               start: '/* GLP-TOKENS v1',               end: '/* /GLP-TOKENS v1 */' },
  { name: 'GLP-SHARED:esc v1',           start: '// GLP-SHARED:esc v1',           end: '// /GLP-SHARED:esc v1' },
  { name: 'GLP-SHARED:safeUrl v1',       start: '// GLP-SHARED:safeUrl v1',       end: '// /GLP-SHARED:safeUrl v1' },
  { name: 'GLP-SHARED:theme-presets v1', start: '// GLP-SHARED:theme-presets v1', end: '// /GLP-SHARED:theme-presets v1' },
  { name: 'GLP-SHARED:machine-icon v1',  start: '// GLP-SHARED:machine-icon v1',  end: '// /GLP-SHARED:machine-icon v1' },
  { name: 'GLP-SHARED:contrast v1',      start: '/* GLP-SHARED:contrast v1',      end: '/* /GLP-SHARED:contrast v1 */' },
  { name: 'GLP-SHARED:machine-match v1', start: '// GLP-SHARED:machine-match v1', end: '// /GLP-SHARED:machine-match v1' },
  { name: 'GLP-SHARED:app-theme-lookup v1', start: '// GLP-SHARED:app-theme-lookup v1', end: '// /GLP-SHARED:app-theme-lookup v1' },
];

function extractBlock(src, { start, end }) {
  const startIdx = src.indexOf(start);
  const endIdx = src.indexOf(end);
  if (startIdx === -1 || endIdx === -1) return null;
  return src.slice(startIdx, endIdx + end.length);
}

for (const block of BLOCKS) {
  test(`${block.name} block is byte-identical with glp-card.js (fails in CI if the neighbor file/block is missing)`, (t) => {
    if (!fs.existsSync(NEIGHBOR_PATH)) {
      const msg = `glp-card.js not found at ${NEIGHBOR_PATH}`;
      if (IN_CI) { assert.fail(`${msg} — CI is expected to fetch the neighbor file for this test`); }
      t.skip(`${msg} — local-dev-only check, skipping`);
      return;
    }

    const ownBlock = extractBlock(OWN_SRC, block);
    assert.ok(ownBlock, `glp-order-card.js must contain a ${block.name} block`);

    const neighborSrc = fs.readFileSync(NEIGHBOR_PATH, 'utf8');
    const neighborBlock = extractBlock(neighborSrc, block);
    assert.ok(neighborBlock, `glp-card.js has no ${block.name} block — it must carry a matching marker`);

    assert.equal(neighborBlock, ownBlock, `${block.name} block drifted between glp-order-card.js and glp-card.js`);
  });
}
