# Security Automation

- Run dependency audit: `npm audit --audit-level=high`.
- Run local secret scan: `node scripts/check-secrets.mjs`.
- Add SAST scanner in CI where available.
