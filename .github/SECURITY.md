# Security Policy

## Repository Access & Ownership

**Good Morning (Aura)** (`ClaudioGarcia98/Aura-Dashboard`) is a publicly visible, proprietary project maintained solely by [@ClaudioGarcia98](https://github.com/ClaudioGarcia98).

- **Read-Only Public Visibility**: The source code is visible for portfolio and transparency purposes, governed by the repository's [LICENSE](../LICENSE).
- **Protected Main Branch & Release Tags**: Direct pushes, force-pushes, branch deletions, and unauthorized modifications to `main` and release tags (`v*`) are blocked via GitHub Rulesets and `CODEOWNERS` enforcement.
- **Locked Production Deployment**: GitHub Pages deployments are restricted strictly to verified commits on `main` initiated by the repository owner.

## Supported Versions

Only the latest deployed release on the `main` branch (`v1.2.x`) is actively supported.

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in **Good Morning (Aura)** or its Cloudflare Worker relay:

1. **Do not open a public GitHub issue.**
2. Use GitHub's **Private Vulnerability Reporting** under the repository's [**Security → Advisories**](https://github.com/ClaudioGarcia98/Aura-Dashboard/security/advisories/new) tab to submit a confidential report directly to the maintainer.
