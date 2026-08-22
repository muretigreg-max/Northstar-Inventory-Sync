const crypto = require('crypto');
const { signPayload } = require('./signatureVerification');

const RECEIVER_URL = process.env.RECEIVER_URL || 'http://localhost:4001/webhooks/inventory';
const SHARED_SECRET = process.env.WEBHOOK_SHARED_SECRET || 'supplier-shared-secret';
const CYCLE_INTERVAL_MS = 5000; // demo interval; production: driven by real stock events
const MAX_CYCLES = 6;
const DUPLICATE_REDELIVERY_EVERY_N_CYCLES = 3;
const OUT_OF_ORDER_DELAY_EVERY_N_CYCLES = 4;
const OUT_OF_ORDER_DELAY_MS = 7000; // long enough to land after the next cycle's event

let stock = {
  'SKU-1001': 42,
  'SKU-1002': 15,
  'SKU-1003': 0,
  'SKU-1004': 87,
};

let cycles = 0;

function driftStock() {
  const before = { ...stock };
  Object.keys(stock).forEach((sku) => {
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    stock[sku] = Math.max(0, stock[sku] + delta);
  });
  const changedSkus = Object.keys(stock).filter((sku) => stock[sku] !== before[sku]);
  return changedSkus;
}

async function sendEvent(event, label) {
  const body = JSON.stringify(event);
  const signature = signPayload(body, SHARED_SECRET);

  try {
    const res = await fetch(RECEIVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body,
    });
    const result = await res.json().catch(() => ({}));
    console.log(`[${label}] eventId=${event.eventId} -> HTTP ${res.status}`, result);
  } catch (err) {
    console.error(`[${label}] delivery failed - receiver unreachable:`, err.message);
  }
}

async function runCycle() {
  cycles += 1;
  const changedSkus = driftStock();

  if (changedSkus.length === 0) {
    console.log(`\n[cycle ${cycles}] no stock movement this cycle - nothing to send.`);
  } else {
    const timestamp = new Date().toISOString();
    const event = {
      eventId: crypto.randomUUID(),
      supplier: 'Acme Medical Supplies',
      timestamp,
      items: Object.fromEntries(changedSkus.map((sku) => [sku, stock[sku]])),
    };

    console.log(`\n[cycle ${cycles}] sending webhook for changed SKUs:`, changedSkus.join(', '));
    await sendEvent(event, `cycle ${cycles}`);

    if (cycles % DUPLICATE_REDELIVERY_EVERY_N_CYCLES === 0) {
      console.log(`[cycle ${cycles}] simulating vendor at-least-once redelivery of the same event...`);
      await sendEvent(event, `cycle ${cycles} (duplicate redelivery)`);
    }

    if (cycles % OUT_OF_ORDER_DELAY_EVERY_N_CYCLES === 0) {
      console.log(`[cycle ${cycles}] simulating a delayed, now out-of-order delivery of this event...`);
      setTimeout(() => sendEvent(event, `cycle ${cycles} (delayed/out-of-order)`), OUT_OF_ORDER_DELAY_MS);
    }
  }

  if (cycles >= MAX_CYCLES) {
    console.log('\nDemo run complete - stopping after', MAX_CYCLES, 'cycles.');
    clearInterval(timer);
  }
}

console.log('Starting mock supplier (webhook push mode)...');
console.log(`Pushing signed events to ${RECEIVER_URL}`);
runCycle();
const timer = setInterval(runCycle, CYCLE_INTERVAL_MS);
