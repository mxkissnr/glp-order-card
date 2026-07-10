# Changelog

## Unreleased
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
