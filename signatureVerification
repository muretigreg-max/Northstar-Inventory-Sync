/**
 * SIGNATURE VERIFICATION SPIKE (Day 2)
 * Prototype status: standalone spike, not yet wired into a live endpoint.

const crypto = require('crypto');

// Simulates what the supplier does before sending a webhook.
function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Simulates what the receiver must do with an inbound webhook.
// Returns false safely for any malformed input instead of throwing.
function verifySignature(payload, signatureHeader, secret) {
  const expected = Buffer.from(signPayload(payload, secret), 'utf8');
  const received = Buffer.from(signatureHeader || '', 'utf8');

  // Blocker fix from Day 2: timingSafeEqual throws on length mismatch,
  // so check length first and fail closed rather than crashing.
  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

// --- Demonstration run ---
const secret = 'supplier-shared-secret';
const payload = JSON.stringify({ sku: 'SKU-1001', quantity: 43, timestamp: Date.now() });

const validSignature = signPayload(payload, secret);
const tamperedPayload = JSON.stringify({ sku: 'SKU-1001', quantity: 999999, timestamp: Date.now() });

console.log('Valid signature accepted:', verifySignature(payload, validSignature, secret));
console.log('Tampered payload rejected:', verifySignature(tamperedPayload, validSignature, secret) === false);
console.log('Malformed/short signature rejected safely:', verifySignature(payload, 'not-a-real-signature', secret) === false);
