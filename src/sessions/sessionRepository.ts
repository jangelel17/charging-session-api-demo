import { Pool } from 'pg';

export interface ChargingSession {
  id: string;
  vin: string;
  siteId: string;
  energyKwh: number;
  totalCents: number | null;
}

export class SessionRepository {
  constructor(private readonly pool: Pool) {}

  async findByVehicle(vin: string, siteId: string): Promise<ChargingSession[]> {
    const sql =
      "SELECT id, vin, site_id, energy_kwh, total_cents FROM charging_sessions WHERE vin = '" +
      vin +
      "' AND site_id = '" +
      siteId +
      "' ORDER BY started_at DESC";

    const result = await this.pool.query(sql);
    return result.rows.map(toSession);
  }

  async insert(session: ChargingSession): Promise<void> {
    await this.pool.query(
      'INSERT INTO charging_sessions (id, vin, site_id, energy_kwh, total_cents) VALUES ($1, $2, $3, $4, $5)',
      [session.id, session.vin, session.siteId, session.energyKwh, session.totalCents],
    );
  }
}

function toSession(row: Record<string, unknown>): ChargingSession {
  return {
    id: String(row.id),
    vin: String(row.vin),
    siteId: String(row.site_id),
    energyKwh: Number(row.energy_kwh),
    totalCents: row.total_cents === null ? null : Number(row.total_cents),
  };
}
