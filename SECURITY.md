# Security Policy

## Supported Versions

Only the **latest release** receives security fixes. Please update before reporting.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please open a **[private security advisory](https://github.com/mxkissnr/glp-order-card/security/advisories/new)** on GitHub and include:

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Potential impact

I will acknowledge your report within **7 days** and aim to release a fix within **30 days** depending on severity.

## Scope

This card runs entirely in the browser as a Lovelace custom element. It communicates with the GLP app via the HA frontend proxy. The primary attack surface is:

- `esc()` output in innerHTML — all user-supplied strings are HTML-escaped
- Order data rendered from the app API — validated and escaped before display

Out of scope: vulnerabilities in Home Assistant or the GLP app itself (report those in their respective repositories).
