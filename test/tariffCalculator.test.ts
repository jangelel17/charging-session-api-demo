import assert from 'node:assert/strict';
import test from 'node:test';

import { priceSession } from '../src/pricing/tariffCalculator';

test('prices an energy-only session at the default tariff', () => {
  const priced = priceSession(42.5, 63);
  assert.equal(priced.totalCents, 2040);
  assert.equal(priced.receiptLine, '42.50 kWh at public-dc-standard — 2040c');
});

test('applies a site operator tariff override', () => {
  const priced = priceSession(10, 30, { name: 'home-ac-offpeak', perKwhCents: 12, perMinuteCents: 1 });
  assert.equal(priced.totalCents, 150);
  assert.match(priced.receiptLine, /home-ac-offpeak/);
});

test('rounds fractional cents to the nearest cent', () => {
  const priced = priceSession(1.004, 0);
  assert.equal(priced.totalCents, 48);
});
