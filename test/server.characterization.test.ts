import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';

import { createApp } from '../src/server';

test('POST /sessions/:id/close prices the session from the request body', async () => {
  const server = createApp({} as never).listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/sessions/s-9/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ energyKwh: 10, durationMinutes: 30, tariffOverride: { name: 'home-ac-offpeak', perKwhCents: 12, perMinuteCents: 1 } }),
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      id: 's-9',
      totalCents: 150,
      receiptLine: '10.00 kWh at home-ac-offpeak — 150c',
    });
  } finally {
    server.close();
  }
});

test('POST /sessions/:id/close without an override uses the default tariff', async () => {
  const server = createApp({} as never).listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/sessions/s-10/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ energyKwh: 42.5, durationMinutes: 63 }),
    });
    assert.deepEqual(await res.json(), {
      id: 's-10',
      totalCents: 2040,
      receiptLine: '42.50 kWh at public-dc-standard — 2040c',
    });
  } finally {
    server.close();
  }
});
