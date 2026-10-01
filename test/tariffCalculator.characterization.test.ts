import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_TARIFF, priceSession } from '../src/pricing/tariffCalculator';

test('renders a site operator receipt template with interpolate and escape delimiters', () => {
  const priced = priceSession(10, 30, {
    name: 'home-ac-offpeak',
    perKwhCents: 12,
    perMinuteCents: 1,
    receiptLineTemplate: '<%= energyKwh %> kWh / <%- tariffName %> / <%= totalCents %>c',
  });
  assert.equal(priced.receiptLine, '10.00 kWh / home-ac-offpeak / 150c');
});

test('html-escapes values rendered with the escape delimiter', () => {
  const priced = priceSession(1, 0, { name: '<b>&site</b>', receiptLineTemplate: '<%- tariffName %>' });
  assert.equal(priced.receiptLine, '&lt;b&gt;&amp;site&lt;/b&gt;');
});

test('keeps default tariff fields that the override does not set', () => {
  const priced = priceSession(10, 30, { name: 'site-rename-only' });
  assert.equal(priced.totalCents, 480);
  assert.equal(priced.receiptLine, '10.00 kWh at site-rename-only — 480c');
});

test('does not mutate the default tariff when an override is applied', () => {
  const before = { ...DEFAULT_TARIFF };
  priceSession(10, 30, { name: 'home-ac-offpeak', perKwhCents: 12, perMinuteCents: 1, receiptLineTemplate: 'x' });
  assert.deepEqual(DEFAULT_TARIFF, before);
});

test('does not pollute Object.prototype from a JSON tariff override', () => {
  const payloads = [
    '{"__proto__":{"pollutedViaProto":"yes"}}',
    '{"constructor":{"prototype":{"pollutedViaConstructor":"yes"}}}',
  ];
  for (const payload of payloads) {
    const priced = priceSession(1, 0, JSON.parse(payload));
    assert.equal(priced.totalCents, 48);
  }
  const probe: Record<string, unknown> = {};
  assert.equal(probe.pollutedViaProto, undefined);
  assert.equal(probe.pollutedViaConstructor, undefined);
});
