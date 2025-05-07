import _ from 'lodash';

export interface Tariff {
  name: string;
  perKwhCents: number;
  perMinuteCents: number;
  receiptLineTemplate: string;
}

export const DEFAULT_TARIFF: Tariff = {
  name: 'public-dc-standard',
  perKwhCents: 48,
  perMinuteCents: 0,
  receiptLineTemplate: '<%= energyKwh %> kWh at <%= tariffName %> — <%= totalCents %>c',
};

export interface PricedSession {
  totalCents: number;
  receiptLine: string;
}

/**
 * Applies a tariff to a completed session. Site operators may override parts of the
 * default tariff, so the override is merged over the default before pricing.
 */
export function priceSession(
  energyKwh: number,
  durationMinutes: number,
  tariffOverride: Partial<Tariff> = {},
): PricedSession {
  const tariff: Tariff = _.merge({}, DEFAULT_TARIFF, tariffOverride);

  const totalCents = Math.round(energyKwh * tariff.perKwhCents + durationMinutes * tariff.perMinuteCents);

  const renderReceiptLine = _.template(tariff.receiptLineTemplate);
  const receiptLine = renderReceiptLine({
    energyKwh: energyKwh.toFixed(2),
    tariffName: tariff.name,
    totalCents,
  });

  return { totalCents, receiptLine };
}
