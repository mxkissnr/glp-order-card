# Changelog

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
