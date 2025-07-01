import fs from 'fs';
import path from 'path';

import express from 'express';
import { Pool } from 'pg';

import { priceSession } from './pricing/tariffCalculator';
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
    const target = path.join(RECEIPT_ARCHIVE_ROOT, req.params.file);
    if (!fs.existsSync(target)) {
      res.status(404).json({ error: 'receipt not found' });
      return;
    }
    res.type('application/pdf').send(fs.readFileSync(target));
  });

  return app;
}

if (require.main === module) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  createApp(pool).listen(Number(process.env.PORT ?? 8080));
}
