# Changelog

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
