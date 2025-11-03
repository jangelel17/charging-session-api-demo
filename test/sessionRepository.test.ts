import assert from 'node:assert/strict';
import test from 'node:test';

import { SessionRepository } from '../src/sessions/sessionRepository';

interface RecordedQuery {
  sql: string;
  params?: unknown[];
}

function fakePool(rows: Record<string, unknown>[], recorded: RecordedQuery[]) {
  return {
    query: async (sql: string, params?: unknown[]) => {
      recorded.push({ sql, params });
      return { rows };
    },
  } as never;
}

test('maps result rows onto charging sessions', async () => {
  const recorded: RecordedQuery[] = [];
  const repo = new SessionRepository(
    fakePool([{ id: 's-1', vin: '5UXDEMO0000000001', site_id: 'SJC-04', energy_kwh: 42.5, total_cents: 2040 }], recorded),
  );

  const sessions = await repo.findByVehicle('5UXDEMO0000000001', 'SJC-04');

  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0], {
    id: 's-1',
    vin: '5UXDEMO0000000001',
    siteId: 'SJC-04',
    energyKwh: 42.5,
    totalCents: 2040,
  });
});

test('leaves an unpriced session total null', async () => {
  const recorded: RecordedQuery[] = [];
  const repo = new SessionRepository(
    fakePool([{ id: 's-2', vin: 'V', site_id: 'S', energy_kwh: 1, total_cents: null }], recorded),
  );

  const sessions = await repo.findByVehicle('V', 'S');
  assert.equal(sessions[0].totalCents, null);
});
