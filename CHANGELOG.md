# Changelog

## [Unreleased]
### Added
- **Type scale, spacing ladder and a contrast-corrected accent line token in the shared `GLP-TOKENS v1` block** — the token groundwork for the "Instrument" redesign (#90, alongside glp-lovelace-card#120 and gaggiuino-local-profiler#811). `--glp-fs-1..6` replaces a tail of 14 distinct ad-hoc font-sizes stepping in 0.02rem increments, `--glp-sp-1..6` replaces the loose gap/padding literals. The smallest step is deliberately 0.8125rem, not the 0.5-0.6rem the card used to reach for: the redesign's border diet removes boxes as a grouping device and must not bring them back as unreadable hairline micro-typography. Radii are deliberately not part of the ladder — the card already resolves every corner through `--glp-radius`/`--glp-radius-sm`, and `--glp-radius` stays HA-led so a card keeps matching the dashboard it sits on.
- **`--glp-aline`: the accent as a thin line, resolved at runtime to clear WCAG 1.4.11's 3:1 non-text contrast floor.** Three of the eight curated machine themes miss that as a line against a dark ground (Ruby Ristretto 1.88:1, Mulberry Mocha 2.09:1, Twilight Turkish 2.38:1) — a pre-existing gap that only becomes visible now that the redesign uses accent lines where it used to draw borders. New `_applyAccentLineContrast()` takes the darker gradient stop (same worst-case reasoning as `--glp-accent-text`) and blends it toward `--glp-text` in 5% steps until it clears 3:1; a theme that already passes is left byte-exact. **Fills are never touched** — `--glp-accent-start`/`-end` keep their configured hex values, so gradients, buttons and the machine icon render exactly as before.
- `_rgbOf()` and `_contrastOf()` split out inside `GLP-SHARED:contrast v1`; `_luminanceOf()` now builds on `_rgbOf()`. The accent line has to *blend* two resolved colours, not just compare their luminance.
- **The card's own CSS now consumes the type scale, spacing ladder and `--glp-aline` token (#90).** `text-transform: uppercase` + `letter-spacing` is gone from all four label sites (`.header`, `.menu-section-title`, `.variant-label`, `.bean-info-label`) — labels are sentence case, small (`--glp-fs-1`) and muted; `font-weight: 800` on that same micro-text is pulled back to 600, since 800 at the old 0.6rem size read as a smudge rather than emphasis. All 14 of the card's distinct ad-hoc font-size literals now resolve through 4 of the 6 scale tokens (`--glp-fs-1/2/3/5`), and every gap/padding/margin resolves through the spacing ladder, with one deliberate exception: `.menu-badge`'s 1px/5px padding stays a literal, since the ladder's 4px floor would nearly quadruple that pill's height. Border diet: `.status-card`, `.machine-off`, `.shot-summary`, `.bean-info` and the menu badges are not clickable, so their full 1px frame is gone in favour of either a single accent-coloured left edge (status/off-state) or the surface fill alone (summary/info panels); `.menu-item`, `.note-input` and `.variant-chip` stay fully bordered since they're all interactive. Their `.selected`/`:focus` border colour now resolves through `--glp-aline` instead of raw `--glp-accent`, the exact "active-row edge marker / focus ring" case that token was built for. New `@media (prefers-reduced-motion: reduce)` block neutralises every transition/animation in the file — there was none before this.

## [1.20.0] – 2026-08-09
### Added
- **The card now syncs its accent color to the app's own Settings → Machines theme picker** instead of only its standalone `theme`/`accent_color`/`accent_gradient` YAML config (#74, part of gaggiuino-local-profiler#701). `_resolveTheme()` first looks up this card's own machine's `theme` from `hass` state — `glp-integration` forwards it verbatim off the app's `GET /api/status` `machines[]` array (gaggiuino-local-profiler#701 + glp-integration#128) — and only falls back to the YAML config when the app has no theme set for that machine (e.g. this card's zero-config/standalone mode, or an older app version). Reactive: since `_applyThemeVars()` already re-runs on every `hass` push, changing the theme in the app now updates the card without a dashboard reload. New `GLP-SHARED:app-theme-lookup v1` block, kept byte-identical with glp-card.js. Closes #74

## [1.19.1] – 2026-08-04
### Changed
- **CI now audits the checked-in `package-lock.json` for known vulnerabilities** — `npm audit --audit-level=high` runs in `validate.yml` right after `npm ci`, closing a gap where `dependency-review-action` only checked PR diffs, not the existing tree. Closes #71
- **Fixed a transitive dev-dependency vulnerability**: `brace-expansion` (via ESLint's `minimatch`) bumped to 5.0.9, completing the `maxLength` mitigation for CVE-2026-14257 (GHSA-rgw5-rvv9-x895) that 5.0.8 left incomplete. Dev tooling only, not part of the shipped card code.
- Routine GitHub Actions/dev-dependency bumps: `actions/dependency-review-action` 4.9.0 → 5.0.0, `actions/upload-artifact` 4.6.2 → 7.0.1, `playwright` 1.62.0 → 1.62.1.
- Added an AI-generated-project disclaimer to the README. Closes #69

No changes to the card's runtime behavior — this release is CI/tooling hardening only.

## [1.19.0] – 2026-08-03
### Added
- **Per-machine colour theme (8 presets + custom flat colour/gradient) and a new detailed Gaggia Classic machine icon.** New `setConfig()` options: `theme` (one of 8 curated preset keys — `amber-americano`, `ruby-ristretto`, `copper-cortado`, `twilight-turkish`, `marbled-macchiato`, `ember-espresso`, `mulberry-mocha`, `frosty-flat-white`), `accent_color` (custom flat `#rrggbb`), and `accent_gradient` (custom two-stop `["#rrggbb1","#rrggbb2"]`) — precedence `accent_gradient` > `accent_color` > `theme` > the card's previous single-colour default. This is the standalone/YAML-only mirror of the same storage contract gaggiuino-local-profiler#594 (app PR #595) added to `machines.theme`; the app becomes the primary source once card-to-app theme sync exists (a later round), with these YAML options as the override. Same config keys and preset mapping land in parallel in glp-lovelace-card for cross-card consistency. Closes #62
  - `GLP-TOKENS`'s single `--glp-accent` is now `--glp-accent-start`/`--glp-accent-end` (both default to the same `--primary-color` value, so an unthemed card renders identically to before); `--glp-accent` is kept as a single-colour legacy alias for the low-opacity `color-mix()` spots that only ever needed one value. `.order-btn` now paints an actual `linear-gradient()` across both stops.
  - `_applySemanticColorContrast()` picks `--glp-accent-text` from the DARKER of the two gradient stops (the worst case `.order-btn`'s full-strength fill sweeps across), not just the first stop — a flat theme (`start === end`) reduces to the previous single-color check. `test/semantic-color-contrast.test.js` gained a case proving this.
  - New small colour-themed machine icon badge (a detailed Gaggia Classic, geometry from an approved GLP Theme Lab mockup) next to the card header title and the multi-machine status line's machine name, replacing the header's generic cup glyph and the `🔀` emoji respectively. Each rendered instance gets a per-card-instance-unique SVG gradient id so more than one card on a dashboard doesn't collide.
  - New `test/theme-config.test.js` covers `_resolveTheme()`'s precedence and strict `#rrggbb`-only hex validation (rejecting CSS colour names and injection-shaped values), `_applyThemeVars()`'s fallback, and `_machineGlyphHtml()`'s per-instance id uniqueness.

## [1.18.2] – 2026-08-01
### Fixed
- **XSS: `_originHtml()` interpolated `o.percent` into the HTML label without escaping it**, the one call site in `_beanInfoHtml()` not wrapped in `_esc()` before reaching `innerHTML` (every other field, including the sibling `o.code` path, already was). Flagged by the HACS reviewer during the `hacs/default` submission review. Closes #57

## [1.18.1] – 2026-07-29
### Fixed
- **`_safeUrl()` returned the raw, unvalidated input instead of the re-serialized `URL.href`**, dropping the quote/angle-bracket neutralization that keeps a malicious href from breaking out of an `href="..."` attribute (glp-card.js's `safeUrl()` already did this correctly). `_getBase()` now strips the trailing slash a bare-origin `href` carries, so `${base}/${path}` callers don't end up with a double slash. Closes #46
- **`_findMachineStatusEntity()` was missing a fallback tier** present in glp-card.js's `_resolvePrefix()` (matching on `friendly_name` containing "gaggiuino" before falling back to the first candidate), so two order cards on the same dashboard could resolve to different machines. Now aligned with glp-card.js's matching order. Closes #46
- **Order→bean attribution matched by display-label string instead of a stable id** — the same bug class already fixed for shot annotations in gaggiuino-local-profiler#456: a bean deleted and reimported under the same name gets a new id, so an existing order reference kept resolving to the wrong (or no) bean. Variant chips now carry `data-bean-id`; selection is tracked by id with a name fallback for older/unresolvable selections, mirroring `resolveBeanForAnnotation()`. The order POST payload now includes `beanId` alongside the existing name field. Closes #35
### Added
- **Playwright E2E smoke test** (`test/e2e/smoke.test.mjs`) covering the optimistic-UI guard (`_clickBlocked`/`_pendingRender` in `set hass()`): asserts the order button enables after variant selection and that a `hass` update arriving between `pointerdown` and `click` doesn't reset an in-progress selection. Shares its static-server/mock-API harness (`scripts/e2e-harness.mjs`) with the screenshot script instead of duplicating it. CI now installs the Chromium binary before running the coverage suite. Closes #48

## [1.18.0] – 2026-07-26
### Changed
- **Flat HA-theme redesign — hybrid tokens, decorative glow removed.** Companion to glp-lovelace-card's identical redesign; purely visual/theming, no behavior change except the chart fix called out below. Closes #39
  - Added the same `GLP-TOKENS v1` block as glp-card.js (byte-identical, shared cross-repo contract — `test/token-sync.test.js`, new, skips cleanly when the neighbor repo/block isn't present locally): `--glp-radius`, `--glp-radius-sm`, `--glp-bg`, `--glp-surface`, `--glp-border`, `--glp-text`, `--glp-sub`, `--glp-accent`, `--glp-ok`, `--glp-warn`, `--glp-err`, and the 4 `--glp-series-*` chart tokens. Reads Home Assistant's own theme CSS variables first, falls back to the old standalone palette values only when a theme doesn't set them. No new YAML config option.
  - Ported `_applySemanticColorContrast()` from glp-card.js verbatim: reads this card's own resolved `--glp-bg` via `getComputedStyle`, computes WCAG relative luminance, and sets `--glp-ok`/`--glp-warn`/`--glp-err` as an inline style on the host (not via a media query — OS/browser color-scheme preference can disagree with the actually-selected HA theme, e.g. dark system + light HA theme). New `test/semantic-color-contrast.test.js` proves the mechanism actually runs and picks the right variant for a light vs. dark resolved background, not just that the method exists.
  - `ha-card` and `.card` previously both painted the same hardcoded background/border/radius directly, bypassing HA's native card theming entirely; `ha-card` is now reset to transparent (background/border/box-shadow none) and `.card` alone carries the single real surface, driven by the new tokens — same fix as glp-card.js's identical double-chrome bug.
  - Removed purely decorative glow/gradient with no replacement: the menu-item shine hairline (`::before`), the selected menu-item's amber glow (`box-shadow`) and gradient background, the order button's gradient background and glow (`box-shadow` at rest and on hover), and the hover `translateY` lift on both menu items and the order button. The status-card and machine-off gradient tints are now flat `color-mix()` backgrounds with a 1px border. The order button keeps a flat background-color hover state as tactile feedback in place of the removed lift+glow.
  - Consolidated the radius scale (previously 20/16/14/12/10/5px mixed) onto `--glp-radius` (outer card, menu items, status cards, buttons) and `--glp-radius-sm` (small badges, bean-info box) — this card's outer radius now matches glp-lovelace-card's, so the two cards' corners actually align when placed side by side on a dashboard. The variant-chip pill keeps its own literal 20px radius since it needs to stay capsule-shaped regardless of theme.
  - **Fixed (correctness, not cosmetic):** `_shotChart()`'s mini pressure/temperature/flow/weight chart normalized every series independently over its own min/max, so a nearly-flat temperature curve (typically 93–94°C across a whole shot) was stretched to fill the full chart height exactly like the pressure curve swinging 0–9 bar — the curves' relative shapes were meaningless when overlaid. Now uses shared axis scales, mirroring glp-card.js's `buildShotChart()`: pressure+flow share a fixed 0–12 bar axis, temperature+weight share a dynamic axis with a 110 floor. `test/shot-chart-shared-axis.test.js` (new) asserts a near-flat series stays visually near-flat while a genuinely wide-swinging series still uses most of the chart height.
  - Chart series now use the same GLP-series palette as glp-card.js (pressure `#0072b2`, flow `#c77000`, temperature `#c0392b`, weight `#009e73`) via the shared `--glp-series-*` tokens, replacing a third, unrelated ad-hoc palette.
  - The order button's, selected-menu-item's and selected-variant-chip's amber highlight color is now `var(--glp-accent)` (HA's `--primary-color`) instead of a hardcoded `#ff9f0a` — this is this card's primary call-to-action color, which is exactly what `--glp-accent` represents, so it gets real hybrid theming too.
  - `scripts/screenshot.mjs` gained `--ha-theme=light|dark` and `--os-scheme=light|dark` axes (plus `--out=`) to render/verify both themes and the OS/HA-theme mismatch case independently; `--light` remains shorthand for light/light.
  - **Follow-up fix:** the `--glp-accent` remapping above had a gap — `.order-btn` kept a hardcoded `color: #1a1205` (near-black) while its background became `var(--glp-accent)` (HA's `--primary-color`, i.e. any color a theme picks). That was safe by coincidence with GLP's own amber-ish primary defaults, but a common dark theme primary like Material "Indigo 900" (`#1a237e`) puts that text at ~1.1:1 contrast on the button — unreadable. Added `--glp-accent-text` to the shared GLP-TOKENS block (also added to glp-card.js to keep the block byte-identical, even though that card has no full-strength accent fill with text on it today) and extended `_applySemanticColorContrast()` (in both repos) to also read `--glp-accent`'s own resolved luminance — independently from `--glp-bg`'s, since theme darkness and accent darkness aren't correlated — and set `--glp-accent-text` to pure `#000`/`#fff` at the same 0.179 luminance split. Unlike `--glp-ok`/`--glp-warn`/`--glp-err`, this is a mathematical guarantee of >=4.58:1 against *any* accent color, not something that needed per-theme checking. `.order-btn` now uses `var(--glp-accent-text)`. Confirmed (measured, not assumed) that this card's other `--glp-accent`-tinted surfaces (`.variant-chip.selected`, `.status-card.pending`, `.menu-item.selected`) don't need the same treatment — they only use `--glp-accent` as a low-opacity (10–14%) `color-mix()` tint under the theme's own already-correct text color, and even the worst-case mix (a fully dark or fully light accent) keeps that composite background close enough to the theme's own bg that contrast stays in the 9–15:1 range. `test/semantic-color-contrast.test.js` gained cases for both accent-luminance directions; `docs/screenshots/card-dark-accent.png` (new) documents the previously-broken case with a deliberately dark mock `--primary-color`.

## [1.17.0] – 2026-07-25
### Added
- **Speciality/normal bean grouping.** Bean-backed menu items (`useBeans`) now split their variant picker into two sections — "Speciality" and "Normal" — using the `category` field on `/api/orders/active-beans` (added in gaggiuino-local-profiler#505; untagged beans or beans from older app versions default to "Normal"). Mirrors the existing trending/regular menu-item split. Non-bean items (`item.variants`) are unaffected — still a single flat chip grid. `_getVariants()` stays as the flat/length helper for the initial render, incremental DOM update and submit-button paths; a new `_getVariantsGrouped()` + shared `_variantInnerHtml()`/`_variantChipHtml()` helpers handle the grouped rendering so `_renderOrderForm()` and `_updateVariantPicker()` no longer duplicate the chip markup. `glp-order-card.js`, `test/variant-grouping.test.js` (new, 6 tests). Closes #36

## [1.16.0] – 2026-07-13
### Added
- **`machine` config option + machine target for orders** (companion to app v2.0.0's multi-machine mode, GLP #317, and `POST /api/orders`'s new optional `machine` field). When set, `_getSwitchEntity()` resolves the switch entity from the `*_machine_status` entity whose name references the configured machine, and every placed order includes `machine` in its payload. The active order's status card shows the machine name (🔀) when the order carries one — hidden entirely for orders without it (e.g. single-machine setups, or orders placed before this feature), so existing setups are visually unchanged. Ingress URL resolution stays bound to the one app instance regardless (documented as an existing limitation, not new). `glp-order-card.js`, `test/machine-config.test.js` (new, 5 tests). Closes #29

## [1.15.0] – 2026-07-12
### Added
- **Blend bean origins.** The backend (gaggiuino-local-profiler v1.120.0) now exposes a bean's full multi-origin data as `origins[]` (`{code, percent?}`) on `/api/orders/active-beans`, in addition to the legacy single-string `origin`. `_originHtml`/`_beanInfoHtml` now render every origin (flag + localized country name + optional percent, joined with " + "), mirroring the `originDisplay()` pattern already used in the app's own frontend. Falls back to the previous single-origin rendering when the backend doesn't send `origins[]` yet (older add-on versions), so this is non-breaking in both directions. `glp-order-card.js`, `test/origin-html.test.js` (new). Closes #28

## [1.14.0] – 2026-07-10
### Added
- **IT/FR/ES/NL translations.** The STRINGS-based i18n table now covers all 6 GLP UI languages; the existing `hass.language` lookup already falls back generically to English for any unsupported language, no detection-logic changes needed. `glp-order-card.js`. Closes #27
- Test suite (`test/`, Node's built-in `node:test`, no new dependency) covering `_esc()` and `_safeUrl()` — the card's HTML-escaping and URL-scheme guards — against script/quote-injection payloads and `javascript:`/`data:` URLs. The tests load the real `glp-order-card.js` in a sandboxed `vm` context rather than reimplementing the logic, matching the approach used for glp-lovelace-card. CI gained a `test` job (`npm test` + a syntax-check build step) in `.github/workflows/validate.yml` alongside the existing HACS validation. Closes #26
- README screenshot (`docs/screenshots/card.png`) showing a populated menu with trending/NEW badges, a selected bean-library variant and its taste-note/origin/process info box. Regenerated on demand via `npm run screenshot` (`scripts/screenshot.mjs`), a throwaway Playwright + `http.createServer` harness that mocks `api/orders/*` with realistic demo data — no real GLP backend needed. Adds `playwright` as a devDependency.

## [1.13.0] – 2026-07-05
### Added
- **Variety row in the bean info box** — `active-beans` ships the bean's variety since app v1.96.0 (Arabica, Geisha, …); shown between origin and processing; closes #25
- **Localized origin country** — origin ISO codes (structured origin field, app v1.96.0+) render as flag emoji + country name in the card language via `Intl.DisplayNames`; legacy free-text origins render unchanged; closes #25
- **`new_badge_days` config option** — how long menu items show the NEW badge (default 7 days, previously hardcoded); closes #25

### Fixed
- `'🎉 Gleich fertig!'` bypassed the STRINGS table and appeared in German for English users — now localized (`almost_ready`); closes #25
- Removed `getConfigElement()` referencing the never-defined `glp-order-card-editor` element; closes #25

## [1.12.0] – 2026-07-03
### Added
- Bean description info box — selecting a bean variant shows the bean's taste notes, origin and processing from the coffee library (served by app v1.95.0+ via `/api/orders/active-beans`), so customers can see what characterizes the coffee; closes #24

## [1.11.0] – 2026-06-30
### Added
- Menu items backed by the bean library (`useBeans`) are hidden when no active beans are in stock (retroactive entry — the version bump shipped without a changelog note)

## [1.10.2] – 2026-06-17
### Fixed
- The card no longer flickers while an order status is shown — redundant full re-renders from status polling / hass ticks are skipped via a view-state signature; the DOM is only rebuilt when something visible changes; closes #23

## [1.10.1] – 2026-06-17
### Fixed
- The shot-summary chart now plots the **temperature** curve (amber) — previously only pressure, weight-flow and weight were drawn, so the brew temperature was never shown; closes #22

## [1.10.0] – 2026-06-17
### Changed
- **Visual redesign** to match the modern GLP Shot Card design language: unified premium dark palette (bg `#111113`, translucent white surfaces, accent `#ff3b30`, warm amber CTA), rounded surfaces (14–20px), subtle top-shimmer on menu tiles, gradient status cards, a gradient amber order button with hover lift, and tasteful micro-animations (fade-in status, pulsing ETA). Order logic (menu, variants, order flow, status, polling, REST proxy) is unchanged; closes #21

## [1.9.1] – 2026-06-17
### Added
- HACS validation workflow (`.github/workflows/validate.yml`) running the official `hacs/action` (`category: plugin`) — required for submission to the HACS default repository; closes #18
- Validation status badge in README
- GitHub repository topics for discoverability

## [1.9.0] – 2026-06-01
### Added
- **Bean library variants** — menu items with `useBeans: true` (toggled via 🫘 in GLP admin) now pull their variant list from the active bean library instead of manually entered strings; the card fetches `GET /api/orders/active-beans` on load and shows bean names (with " · Decaf" suffix when flagged) as the variant picker; requires GLP add-on v1.77.0+; closes mxkissnr/gaggiuino-local-profiler#139

## [1.8.0] – 2026-06-01
### Added
- **Drink variants** — if a menu item has variants configured in GLP (e.g. Regular / Decaf), a variant picker appears after selecting the drink; submit button is disabled until a variant is chosen; variant is shown in all status messages (pending, accepted, done, declined) and sent to the GLP backend; requires GLP add-on v1.76.0+; closes mxkissnr/gaggiuino-local-profiler#137

## [1.7.1] – 2026-05-28
### Changed
- Token bootstrapping in direct-URL mode now calls `/api/token` instead of `/api/status` (GLP v1.72.0+); in direct-URL mode, add `glp_token: <your-token>` to the card YAML config as the token is no longer auto-discoverable from an unauthenticated endpoint; ingress mode (recommended, no `glp_url`) is unaffected

## [1.7.0] – 2026-05-28
### Added
- **Queue position** — when order is `pending`, the card now shows queue position and estimated wait time (e.g. "Pos. 2 in der Warteschlange · ~8 Min") sourced from new `GET /api/orders/queue-eta` endpoint (requires GLP add-on v1.70.0+); closes #12 (follow-up)

## [1.6.1] – 2026-05-28
### Fixed
- Removed device selector (📱) from customer order form — device assignment is admin-only in the GLP barista backend; customers no longer see or interact with notify service selection; closes #12 (follow-up)

## [1.6.0] – 2026-05-28
### Added
- **Device selector for push notifications** — optional collapsed 📱 section below the note input; customer picks their HA mobile device from a `<select>` populated via `/api/orders/notify-services`; last selection persisted in `localStorage`; `notifyService` included in POST body so the GLP add-on uses it for accept/done/declined notifications; section hidden when no devices are available; closes #12

## [1.5.1] – 2026-05-27
### Fixed
- Menu item clicks no longer miss or flicker: `_render()` (full DOM replacement) is now blocked for 300 ms after any `pointerdown` inside the card — prevents HA state updates wiping the target element between `pointerdown` and `click`; closes #16
- Menu item selection no longer triggers a full re-render — instead only the `.selected` CSS class and the submit button label/disabled state are updated in-place, eliminating all visual flicker on item tap
- `set hass()` renders are now debounced by 1 s to prevent the frequent HA entity-state ticks from interrupting interactions; machine on/off changes still reflect within ~1 s

## [1.5.0] – 2026-05-27
### Added
- Multi-series shot chart in the completed-order summary: replaced the single blue sparkline with a full SVG chart showing pressure (blue), weight flow (green) and shot weight (purple), each normalised to its own min/max; a colour-coded legend is rendered below the chart; closes #13
- Trending section in the order form: menu items flagged as trending by the barista are shown in a "🔥 Trending" section above the full menu, separated by an "All drinks" header; trending items display a 🔥 badge; requires GLP add-on v1.58.0+; closes #14
- NEW badge on recently added menu items: any item with a `createdAt` timestamp younger than 7 days shows a "NEW" badge in the order form; requires GLP add-on v1.58.0+; closes #15

## [1.4.2] – 2026-05-26
### Fixed
- Note input no longer loses focus immediately on mobile — `set hass()` and the polling render now check a `_noteInteracting` flag and skip `_render()` while the input is focused; on blur any pending status update is applied; regression introduced in v1.4.1; closes #11

## [1.4.1] – 2026-05-26
### Fixed
- Card now updates within 3 s when a pending or accepted order changes status — replaced fixed 10 s `setInterval` with a chained `setTimeout` that uses 3 s while an order is active and 10 s in menu state; closes #10
- Initial load no longer stalls when `connectedCallback` fires before `hass` is set — `set hass()` now triggers `_load()` on first call if the menu is still unloaded

## [1.4.0] – 2026-05-26
### Changed
- Zero-config mode now routes all API calls through the HA integration REST proxy (`/api/glp/orders/*`, `/api/glp/shots/*`) via `hass.fetchWithAuth` instead of Supervisor ingress; eliminates the 503 errors caused by missing ingress session cookies; requires glp-integration v1.7.0+; closes #9

## [1.3.7] – 2026-05-26
### Fixed
- `hass.fetchWithAuth` expects a path (`/api/hassio_ingress/...`), not a full URL — passing the absolute URL caused the HA origin to be prepended twice (`https://ha.kissner.prohttps//...`), triggering a CORS error; now extracts `pathname + search` from the URL before passing to `fetchWithAuth`; closes #8

## [1.3.6] – 2026-05-26
### Fixed
- Replaced ingress session approach (POST `/api/hassio/ingress/session` → 401) with `hass.fetchWithAuth()` for all requests in ingress mode; HA Supervisor accepts requests authenticated via Bearer token without a separate session cookie; closes #8

## [1.3.5] – 2026-05-26
### Fixed
- `_ensureIngress()` used a raw `fetch` with `Authorization: Bearer` header → HA returned 401 because the access token may be stale; switched to `this._hass.callApi('POST', 'hassio/ingress/session')` which handles token refresh automatically; also extracts the session string from the response and writes it to the `ingress_session` cookie on the correct ingress path so HA Supervisor accepts subsequent proxied requests; closes #8

## [1.3.4] – 2026-05-25
### Fixed
- Card received 503 from HA Supervisor on all `/api/orders/*` calls: HA requires an active ingress session cookie for XHR requests made from a Lovelace card (outside the ingress iframe); card now calls `POST /api/hassio/ingress/session` before requests, throttled to once per 30 s; closes #7

## [1.3.3] – 2026-05-25
### Fixed
- Card showed "Orders are currently paused" permanently even after the barista re-enabled orders in the backend: `_loadStatus()` now re-fetches `GET /api/orders/settings` on every 10 s poll so barista toggle changes are picked up without a page reload; closes #6
- `_load()` treated any non-2xx response (401, 500 …) the same as a genuine feature-disabled 404, permanently locking the "paused" state; only a double-404 (both `/api/orders/menu` and `/api/orders/settings`) now sets the paused/empty state — other errors leave `this._menu = null` so the existing retry logic kicks in

## [1.3.2] – 2026-05-25
### Fixed
- Card showed "Orders are currently paused" permanently after any transient network error on initial load (regression from v1.3.1 where the catch block was changed to set `enabled = false`); catch block now leaves state unchanged so the "Loading…" spinner remains and the 10-second poll retries automatically; closes #5
- Added `fromLoad` flag to `_loadStatus()` so the 10-second poll retries the full `_load()` when the initial load failed (`this._menu === null`), allowing the card to self-recover without a manual page reload

## [1.3.1] – 2026-05-25
### Fixed
- Card showed "Loading…" indefinitely when `enable_orders: false` in add-on config: `_load()` now checks HTTP status before parsing JSON; a non-2xx response (e.g. 404 when orders feature is disabled) sets `this._enabled = false` so the "paused" message is shown instead; closes #4
- `_renderOrderForm` used the same "Loading…" string for an empty menu array (already loaded) as for the null state (not yet loaded); empty menu now shows "Noch kein Menü konfiguriert" / "No menu configured yet"

## [1.3.0] – 2026-05-25
### Added
- Shot summary when order is done: fetches the shot by `order.shotId` (set by add-on v1.47.0 at completion time); shows profile name, duration, yield and a mini SVG pressure sparkline; requires GLP add-on v1.47.0+; closes #3

## [1.2.0] – 2026-05-25
### Added
- Order acceptance state: card fetches `GET /api/orders/settings` on load; shows "Bestellungen momentan pausiert" / "Orders are currently paused" when barista has disabled acceptance; requires GLP add-on v1.46.0+

## [1.1.1] – 2026-05-25
### Fixed
- Card rendered nothing — `_render()` guarded on `this._base` which is never set as a property; the base URL is provided by `_getBase()` method; closes #2

## [1.1.0] – 2026-05-25
### Added
- Zero-config mode: `glp_url` and `switch_entity` are now optional; the card auto-detects the GLP backend via the HA ingress path (`/api/hassio_ingress/gaggiuino_local_profiler`) so no manual URL configuration is needed in a standard HA setup; `switch_entity` is auto-read from the `machine_status` sensor attribute; closes #1

## [1.0.0] – 2026-05-25
### Added
- Initial release: customer-facing Lovelace card for the GLP order system
- Drink menu grid loaded from GLP add-on (`GET /api/orders/menu`)
- Order placement with optional note; customer identified by logged-in HA user name
- Order status polling every 10 s: pending → accepted (ETA countdown) → done / declined (with reason)
- Machine-off state shown when `switch_entity` is configured and off
- Auto-detects DE / EN from browser locale
- Requires GLP add-on v1.45.0+
