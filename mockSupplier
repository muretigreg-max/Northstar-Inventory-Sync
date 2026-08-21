/**
 * MOCK SUPPLIER API
 * Stands in for a real vendor inventory endpoint so the polling client

const express = require('express');
const app = express();
const PORT = 4000;

let stock = {
  'SKU-1001': 42,
  'SKU-1002': 15,
  'SKU-1003': 0,
  'SKU-1004': 87,
};

function driftStock() {
  Object.keys(stock).forEach((sku) => {
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    stock[sku] = Math.max(0, stock[sku] + delta);
  });
}

app.get('/api/stock', (req, res) => {
  driftStock();
  res.json({
    supplier: 'Acme Medical Supplies',
    timestamp: new Date().toISOString(),
    items: stock,
  });
});

app.listen(PORT, () => {
  console.log(`Mock supplier API running on http://localhost:${PORT}/api/stock`);
});
