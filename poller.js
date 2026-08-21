 * POLLING-BASED INVENTORY SYNC
 * Prototype status: END OF DAY 3 (pre-pivot)

const fs = require('fs');
const path = require('path');

const SUPPLIER_URL = 'http://localhost:4000/api/stock';
const STORE_PATH = path.join(__dirname, 'inventory.json');
const POLL_INTERVAL_MS = 5000; // demo interval; production: e.g. 15 minutes
const MAX_CYCLES = 4; // stop after a few cycles for this demo run

let cycles = 0;

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) {
    return { items: {}, lastSynced: null, changeLog: [] };
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

async function pollOnce() {
  cycles += 1;
  console.log(`\n[cycle ${cycles}] polling supplier...`);

  let response;
  try {
    response = await fetch(SUPPLIER_URL);
  } catch (err) {
    console.error('Poll failed — supplier unreachable:', err.message);
    return;
  }

  if (!response.ok) {
    console.error('Poll failed — supplier returned status', response.status);
    return;
  }

  const payload = await response.json();
  const store = loadStore();
  const changes = [];

  Object.entries(payload.items).forEach(([sku, newQty]) => {
    const oldQty = store.items[sku];
    if (oldQty === undefined) {
      changes.push(`${sku}: initial stock recorded at ${newQty}`);
    } else if (oldQty !== newQty) {
      changes.push(`${sku}: ${oldQty} -> ${newQty}`);
    }
    store.items[sku] = newQty;
  });

  store.lastSynced = payload.timestamp;
  if (changes.length) {
    store.changeLog.push({ syncedAt: payload.timestamp, changes });
    console.log('Changes detected:', changes.join('; '));
  } else {
    console.log('No changes since last poll.');
  }

  saveStore(store);

  if (cycles >= MAX_CYCLES) {
    console.log('\nDemo run complete — stopping after', MAX_CYCLES, 'cycles.');
    clearInterval(timer);
  }
}

console.log('Starting polling-based inventory sync...');
pollOnce();
const timer = setInterval(pollOnce, POLL_INTERVAL_MS);
