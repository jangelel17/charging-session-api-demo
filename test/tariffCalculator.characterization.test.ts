import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_TARIFF, priceSession } from '../src/pricing/tariffCalculator';

test('keeps default tariff fields that an override does not set', () => {
  const priced = priceSession(10, 0, { perKwhCents: 30 });
  assert.equal(priced.totalCents, 300);
  assert.equal(priced.receiptLine, '10.00 kWh at public-dc-standard — 300c');
});

test('does not mutate the default tariff when merging an override', () => {
  const before = { ...DEFAULT_TARIFF };
  priceSession(5, 10, { name: 'site-override', perKwhCents: 1, perMinuteCents: 2, receiptLineTemplate: 'x' });
  assert.deepEqual(DEFAULT_TARIFF, before);
});

test('renders an operator-supplied receipt line template', () => {
  const priced = priceSession(12.345, 0, {
    name: 'home-ac-offpeak',
    perKwhCents: 10,
    receiptLineTemplate: '<%- tariffName %>: <%= energyKwh %> kWh = <%= totalCents %>c',
  });
  assert.equal(priced.totalCents, 123);
  assert.equal(priced.receiptLine, 'home-ac-offpeak: 12.35 kWh = 123c');
});

test('html-escapes values rendered with the escape delimiter', () => {
  const priced = priceSession(1, 0, { name: '<b>&</b>', receiptLineTemplate: '<%- tariffName %>' });
  assert.equal(priced.receiptLine, '&lt;b&gt;&amp;&lt;/b&gt;');
});

test('ignores a __proto__ key in a JSON tariff override', () => {
  const override = JSON.parse('{"__proto__": {"pollutedByTariff": true}, "perKwhCents": 20}');
  const priced = priceSession(2, 0, override);
  assert.equal(priced.totalCents, 40);
  assert.equal(({} as Record<string, unknown>).pollutedByTariff, undefined);
});
