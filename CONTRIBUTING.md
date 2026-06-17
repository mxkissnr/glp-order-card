# Contributing

Bug reports, feature ideas and pull requests are welcome!

## Workflow

1. **Open an issue first** — describe the bug or feature before writing any code
2. **Fork & branch** — `feature/short-description` or `fix/short-description`
3. **Implement** — commit with `Closes #N` in the message
4. **Pull request** — reference the issue; keep PRs focused on one thing

## Reporting a bug

Include:
- Card version (visible in the browser console on HA startup)
- GLP app version (the orders feature requires `enable_orders: true`)
- Expected vs. actual behaviour
- Browser console output if relevant

## Code notes

| Area | Details |
|---|---|
| File | Single JS file `glp-order-card.js` — no build step, no bundler |
| Style | Vanilla ES2020, Web Components (`HTMLElement` + Shadow DOM) |
| Backend | Communicates with GLP app `/api/orders/*` and `/api/menu` endpoints |
| Testing | Load the card as a HACS custom resource with `enable_orders: true` in the app config |

## Versioning

`MAJOR.MINOR.PATCH` — update the `GLP_ORDER_CARD_VERSION` constant at the top of `glp-order-card.js`.
