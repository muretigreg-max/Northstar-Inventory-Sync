# Inventory Sync

A webhook-based inventory sync service that keeps a local stock record
aligned with a supplier's push events, secured with HMAC-SHA256 signature
verification.

## The pivot

- We no longer call the supplier; the supplier calls **us**, at
  `POST /webhooks/inventory`, whenever stock changes.
- Every inbound event is **signed** by the supplier (HMAC-SHA256 over the
  raw JSON body) and **verified** against a shared secret before it's
  parsed or applied - an unsigned or incorrectly signed request is
  rejected with `401` and never touches the inventory store.
- Delivery is **at-least-once and not guaranteed in order**. The receiver
  handles both:
  - **Duplicate delivery**: each event carries an `eventId`; a redelivered
    event with an `eventId` we've already processed is a harmless no-op.
  - **Out-of-order delivery**: each SKU tracks the timestamp of the last
    event actually applied to it. An event whose timestamp is older than
    (or equal to) what's already applied for that SKU is skipped for that
    SKU specifically - other SKUs in the same event are still evaluated
    and applied independently.

## New technology used

**HMAC-SHA256 webhook signature verification**, promoted from a Day 2
spike (`signatureVerification.js`) into the security boundary for every
inbound update.

## Quick start

Install dependencies:

    npm install

In one terminal, start the webhook receiver:

    npm run start:receiver

In another terminal, start the mock supplier (pushes signed events on an
interval, including a simulated duplicate redelivery and a simulated
out-of-order delivery so those resilience properties are visible in a
live run, not just in the test suite):

    npm run start:supplier

Check the current snapshot at any time:

    curl http://localhost:4001/inventory

Run the signature verification module's standalone demonstration:

    npm run demo:signature

## Tests

    npm test

Covers, among other cases:
- A validly signed event updates multiple SKUs and is reflected in the
  snapshot.
- An invalid signature is rejected with `401` and never touches the store.
- A signature computed with the wrong shared secret is rejected.
- **Duplicate delivery**: exact redelivery of the same `eventId` is a
  no-op (no second change-log entry).
- **Out-of-order delivery**: a stale event for a SKU is skipped while
  other SKUs in the same event still apply; a later-arriving newer event
  is never overwritten backwards by a late arrival.
- A mixed event applies only the SKUs that are genuinely newer.
- Two concurrent events for the same SKU don't race; the later timestamp
  always wins regardless of arrival order.
- A malformed event payload is rejected with `400`.

## Files
- `signatureVerification.js` — HMAC-SHA256 sign/verify, now a shared
  module (originally a Day 2 standalone spike).
- `mockSupplier.js` — simulated vendor; pushes signed webhook events
  instead of serving a poll endpoint.
- `inventory.json` — the local store: current stock, sync history, and
  (new) per-SKU timestamps and processed event ids.
