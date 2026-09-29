import fs from 'fs';

import express from 'express';
import { Pool } from 'pg';

import { priceSession } from './pricing/tariffCalculator';
import { ReceiptNotFoundError, resolveReceiptPath } from './receipts/receiptArchive';
import { SessionRepository } from './sessions/sessionRepository';

const RECEIPT_ARCHIVE_ROOT = process.env.RECEIPT_ARCHIVE_ROOT ?? '/var/lib/charging/receipts';

export function createApp(pool: Pool): express.Express {
  const app = express();
  app.use(express.json());

  const sessions = new SessionRepository(pool);

  app.get('/sessions/search', async (req, res) => {
    const vin = String(req.query.vin ?? '');
    const siteId = String(req.query.siteId ?? '');
    res.json(await sessions.findByVehicle(vin, siteId));
  });

  app.post('/sessions/:id/close', async (req, res) => {
    const { energyKwh, durationMinutes, tariffOverride } = req.body ?? {};
    const priced = priceSession(Number(energyKwh), Number(durationMinutes), tariffOverride ?? {});
    res.json({ id: req.params.id, ...priced });
  });

  app.get('/receipts/:file', (req, res) => {
    let target: string;
    try {
      target = resolveReceiptPath(RECEIPT_ARCHIVE_ROOT, req.params.file);
    } catch (error) {
      if (error instanceof ReceiptNotFoundError) {
        res.status(404).json({ error: 'receipt not found' });
        return;
      }
      throw error;
    }
    res.type('application/pdf').send(fs.readFileSync(target));
  });

  return app;
}

if (require.main === module) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  createApp(pool).listen(Number(process.env.PORT ?? 8080));
}
