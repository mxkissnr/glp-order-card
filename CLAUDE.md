# CLAUDE.md — GLP Order Card

Working rules for this repo (mirrors the app repo's rules; full rationale lives in
`../gaggiuino-local-profiler/CLAUDE.md`).

- **Issue first, then code** — no implementation without a GitHub issue number
  (`gh issue create --repo mxkissnr/glp-order-card`, add to GLP Roadmap project 2,
  owner mxkissnr). Only exception: typos.
- **Language**: code/comments/commits/issues/PRs in English.
- **Version** lives in `src/glp-order-card.ts` (`GLP_ORDER_CARD_VERSION`) — patch for
  fixes, minor for features. Never bump it outside a release.
- **Build**: the root `glp-order-card.js` is generated from `src/` by `npm run build`
  (esbuild) and committed; never edit it by hand.
- **Tests/build**: `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`
  must be green after every change; a newly-failing test is a stop condition.
- **Commits**: CHANGELOG.md entry in the same commit as the code. Trailer required,
  model spelled out: `Co-Authored-By: Claude <model name> <noreply@anthropic.com>`.
- **XSS**: card renders HA data into DOM — always escape/textContent, never
  unsanitized innerHTML from entity attributes.
- **PR AI disclosure** — every PR fills the PR template's "AI assistance disclosure" section
  (`none`/`assisted`/`substantial`/`generated` + tool/model); every AI-assisted commit carries
  a `Co-Authored-By:` trailer. CI enforces it. See CONTRIBUTING.md.
- **Releases** end at the GitHub release + HACS; no HA deploy (Max installs himself).
- Screenshots: `npm run screenshot` regenerates docs assets when the UI changes.
