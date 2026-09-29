import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import type { Pool } from 'pg';

const archiveRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'receipts-'));
fs.writeFileSync(path.join(archiveRoot, 'CS-2026-0001.pdf'), 'receipt-body');
fs.mkdirSync(path.join(archiveRoot, 'archive-2025'));
fs.writeFileSync(path.join(archiveRoot, 'archive-2025', 'CS-2025-0917.pdf'), 'older-receipt-body');

// The archive root is read at module load, so it has to be set before the server is required.
process.env.RECEIPT_ARCHIVE_ROOT = archiveRoot;

const { createApp } = require('../src/server') as typeof import('../src/server');

const app = createApp({} as Pool);

interface Captured {
  status: number;
  body: string;
  contentType?: string;
}

function get(url: string): Promise<Captured> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (typeof address === 'string' || address === null) {
        reject(new Error('no port'));
        return;
      }
      fetch(`http://127.0.0.1:${address.port}${url}`)
        .then(async (response) => {
          const captured: Captured = {
            status: response.status,
            body: await response.text(),
            contentType: response.headers.get('content-type') ?? undefined,
          };
          server.close(() => resolve(captured));
        })
        .catch((error) => server.close(() => reject(error)));
    });
  });
}

test('serves a receipt that exists in the archive root', async () => {
  const response = await get('/receipts/CS-2026-0001.pdf');
  assert.equal(response.status, 200);
  assert.equal(response.body, 'receipt-body');
  assert.match(response.contentType ?? '', /application\/pdf/);
});

test('serves a receipt from a dated sub-folder of the archive root', async () => {
  const response = await get('/receipts/archive-2025%2FCS-2025-0917.pdf');
  assert.equal(response.status, 200);
  assert.equal(response.body, 'older-receipt-body');
});

test('returns 404 for a receipt that is not in the archive', async () => {
  const response = await get('/receipts/CS-2026-9999.pdf');
  assert.equal(response.status, 404);
  assert.deepEqual(JSON.parse(response.body), { error: 'receipt not found' });
});
