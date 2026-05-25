<p align="center">
  <img src="https://raw.githubusercontent.com/mxkissnr/gaggiuino-local-profiler/main/gaggiuino-local-profiler/logo.svg" alt="GLP Order Card" width="480"/>
</p>

<p align="center">
  <a href="https://github.com/mxkissnr/glp-order-card/releases">
    <img src="https://img.shields.io/github/v/tag/mxkissnr/glp-order-card?color=%23f59e0b&label=Version&style=flat-square" alt="Version"/>
  </a>
  <img src="https://img.shields.io/badge/Home%20Assistant-Lovelace%20Card-41bdf5?logo=home-assistant&style=flat-square" alt="HA Lovelace"/>
  <img src="https://img.shields.io/badge/HACS-Custom-orange?style=flat-square" alt="HACS Custom"/>
  <img src="https://img.shields.io/badge/Built%20with-Claude%20by%20Anthropic-D97706?style=flat-square" alt="Built with Claude"/>
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License GPL-3.0"/>
</p>

<p align="center">
  Customer-facing Lovelace card for ordering espresso via <a href="https://github.com/mxkissnr/gaggiuino-local-profiler">Gaggiuino Local Profiler</a>.<br/>
  Customers browse the menu, place an order and track its status in real time — all from a Home Assistant dashboard.
</p>

---

## Prerequisites

- [Gaggiuino Local Profiler](https://github.com/mxkissnr/gaggiuino-local-profiler) add-on v1.45.0 or later, installed and running
- The barista configures the menu in the new **Bestellungen** tab in the GLP web UI

## Installation via HACS

1. In HACS → Frontend → ⋮ → Custom repositories → add `mxkissnr/glp-order-card` (category: **Lovelace**)
2. Download the card
3. Add a manual resource or let HACS handle it

## Configuration

Minimal — zero config needed in a standard HA setup:
```yaml
type: custom:glp-order-card
```

Full config (only needed for direct/external access):
```yaml
type: custom:glp-order-card
glp_url: http://homeassistant.local:8099   # optional — direct port URL (auto-detected via ingress)
switch_entity: switch.espresso_plug        # optional — auto-detected from GLP integration sensor
title: Bestellen                           # optional — card header title
```

### Options

| Option | Description | Default |
|---|---|---|
| `glp_url` | URL of the GLP add-on (port 8099). Only needed when accessing from outside HA or if auto-detection fails. | *(auto via ingress)* |
| `switch_entity` | HA switch entity for the machine. Auto-detected from the `machine_status` sensor attribute if the GLP integration is installed. | *(auto)* |
| `title` | Card header title | `Bestellen` / `Order` (auto-detected language) |

## How it works

1. The card loads the drink menu from the GLP add-on (`GET /api/orders/menu`)
2. The customer selects a drink, optionally adds a note, and presses the order button
3. The order is submitted with the logged-in HA user's name as customer identifier
4. The card polls the order status every 10 seconds and updates automatically
5. When the barista accepts the order, the card shows the ETA countdown
6. When done, the card shows a "Ready!" confirmation
7. The customer can then place a new order

The barista manages orders from the **Bestellungen** tab in the GLP web UI.

## Languages

Auto-detected from the browser locale. Currently supported: 🇩🇪 DE, 🇬🇧 EN.

---

<p align="center">
  <a href="https://github.com/mxkissnr/gaggiuino-local-profiler/wiki">📖 Documentation (Wiki)</a> ·
  <a href="CHANGELOG.md">📋 Changelog</a> ·
  <a href="https://github.com/mxkissnr/gaggiuino-local-profiler">🔧 GLP Add-on</a> ·
  <a href="https://github.com/mxkissnr/glp-lovelace-card">📊 GLP Shot Card</a> ·
  <a href="https://github.com/mxkissnr/glp-order-card/issues">🐛 Issues</a>
</p>

---

## License

GPL-3.0 © 2024–2026 mxkissnr — free to use, fork and modify; any derivative work must remain open source under the same license. Commercial use is not permitted.

## Acknowledgements

Built on top of the [Gaggiuino](https://gaggiuino.github.io/) project and the [Gaggiuino Local Profiler](https://github.com/mxkissnr/gaggiuino-local-profiler) add-on.

---

<p align="center">
  <sub>Built with <a href="https://claude.ai/code">Claude Code</a> by Anthropic</sub>
</p>
