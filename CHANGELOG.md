# Changelog

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
