# Inventory Sync Prototype

A polling-based inventory sync tool that keeps a local stock record aligned
with a supplier's API, built as part of an independent-learning exercise on
webhook verification.

## Status

The working prototype (`poller.js`) uses polling. A pivot to webhook-based
updates, secured with HMAC signature verification, has been scoped but not
yet implemented — see `docs/Learning_Blocker_Journal_Days1-4.docx` for the
full day-by-day log, including the Day 4 pivot writeup.

## Files

- `mockSupplier.js` — a mock vendor API with stock levels that drift on
  each request, used to develop and test the poller without a supplier.
- `poller.js` — polls the mock supplier on an interval, diffs stock levels
  against the last known state, and writes changes to `inventory.json`
  with a change log.
- `signatureVerification.js` — a standalone spike for HMAC-SHA256 webhook
  signature verification (sign, verify, and safe rejection of tampered or
  malformed signatures), built ahead of the webhook pivot.
- `docs/Learning_Blocker_Journal_Days1-4.docx` — the Learning & Blocker
  Journal covering Days 1–4.

## Running it

Install dependencies:

    npm install

In one terminal, start the mock supplier:

    npm run start:supplier

In another terminal, run the poller:

    npm run start:poller

Run the signature-verification spike on its own:

    npm run spike:signature
