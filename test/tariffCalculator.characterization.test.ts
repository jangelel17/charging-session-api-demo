import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_TARIFF, priceSession } from '../src/pricing/tariffCalculator';

test('a partial override keeps the default rates and receipt template', () => {
  const priced = priceSession(10, 30, { name: 'site-promo' });
  assert.equal(priced.totalCents, 480);
  assert.equal(priced.receiptLine, '10.00 kWh at site-promo — 480c');
});

test('an undefined override field does not replace the default', () => {
  const priced = priceSession(10, 0, { name: undefined, perKwhCents: undefined });
  assert.equal(priced.receiptLine, '10.00 kWh at public-dc-standard — 480c');
});

test('pricing with an override leaves the default tariff unchanged', () => {
  const before = { ...DEFAULT_TARIFF };
  priceSession(10, 30, { name: 'home-ac-offpeak', perKwhCents: 12, perMinuteCents: 1 });
  assert.deepEqual(DEFAULT_TARIFF, before);
});

test('an operator receipt template interpolates and escapes session fields', () => {
  const priced = priceSession(2, 0, {
    name: '<Depot & Co>',
    receiptLineTemplate: '<%- tariffName %>: <%= energyKwh %> kWh / <%= totalCents %>c',
  });
  assert.equal(priced.receiptLine, '&lt;Depot &amp; Co&gt;: 2.00 kWh / 96c');
});

test('prototype keys in a JSON override do not reach Object.prototype', () => {
  const payloads = ['{"__proto__":{"polluted":"yes"}}', '{"constructor":{"prototype":{"polluted":"yes"}}}'];
  for (const payload of payloads) {
    priceSession(1, 0, JSON.parse(payload));
    assert.equal(({} as Record<string, unknown>).polluted, undefined, payload);
  }
});
