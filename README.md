# zorelan-support-verification-demo — RETIRED

**This repo is retired. Do not use it for current product testing.**

The canonical Zorelan demo now lives at:

## 👉 https://zorelan.com/demo

## Why it was retired

This was an early, separate, partly-scripted support-reply demo
(`SEND / REVIEW / BLOCK` driven by keyword regex). The main Zorelan app now has
a single canonical structured **execution-gate** demo that evaluates a real
`proposed_action` + `policy` and returns **ALLOW / REVIEW / BLOCK** — backed by
the public `POST /v1/evaluate` endpoint and the SDK's `evaluateAction()`.
Keeping a duplicated, outdated demo surface caused confusion, so it has been
consolidated into the main app.

## What this repo now does

- **All routes redirect** to `https://zorelan.com/demo` (permanent 308) via a
  catch-all rule in `next.config.ts`, plus a fallback redirect on `app/page.tsx`.
- **The old demo API routes** (`/api/ai`, `/api/generate`, `/api/verify`) now
  return **HTTP 410 Gone** with a pointer to the canonical demo. The old
  scripted logic has been removed.

## Notes

- The repo is intentionally kept (not deleted) so the deployment can serve the
  redirect. It can be decommissioned entirely once DNS/hosting for this app is
  pointed elsewhere or removed.
- No secrets are required for the redirect; `.env.local` is unused by the
  retired routes.
