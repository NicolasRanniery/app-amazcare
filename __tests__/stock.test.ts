import {
  calculateStockEstimate,
  decrementStockOnDoseTaken,
  replenishStock,
  calibrateStock,
} from '../src/domain/stock';
import { Medication } from '../src/domain/types';

describe('Domain: stock.ts (Stock estimation and management)', () => {
  const baseMed: Medication = {
    id: 'med-1',
    name: 'Medicamento A',
    strength: '500 mg',
    dose: { amount: 1, unit: 'comprimido' },
    times: ['08:00', '20:00'], // 2 per day
    startDate: '2026-11-20',
    endDate: null,
    drawer: 1,
    stock: { estimated: 20, minAlert: 5, updatedAt: '2026-11-20T00:00:00Z' },
  };

  it('calculates days remaining and status correctly', () => {
    // 20 tablets, 2 per day = 10 days
    const estOk = calculateStockEstimate(baseMed);
    expect(estOk.status).toBe('ok');
    expect(estOk.daysRemaining).toBe(10);
    expect(estOk.displayMessage).toContain('Estoque suficiente');

    // 4 tablets, 2 per day = 2 days (minAlert is 5 => baixo)
    const lowMed: Medication = {
      ...baseMed,
      stock: { ...baseMed.stock, estimated: 4 },
    };
    const estLow = calculateStockEstimate(lowMed);
    expect(estLow.status).toBe('baixo');
    expect(estLow.daysRemaining).toBe(2);
    expect(estLow.displayMessage).toContain('Estoque baixo');

    // 0 tablets = esgotado
    const emptyMed: Medication = {
      ...baseMed,
      stock: { ...baseMed.stock, estimated: 0 },
    };
    const estEmpty = calculateStockEstimate(emptyMed);
    expect(estEmpty.status).toBe('esgotado');
    expect(estEmpty.daysRemaining).toBe(0);
    expect(estEmpty.displayMessage).toContain('Estoque esgotado');
  });

  it('decrements stock when dose is taken and does not drop below 0', () => {
    const updated = decrementStockOnDoseTaken(baseMed, '2026-11-23T08:00:00Z');
    expect(updated.stock.estimated).toBe(19);
    expect(updated.stock.updatedAt).toBe('2026-11-23T08:00:00Z');

    const nearZeroMed: Medication = {
      ...baseMed,
      stock: { ...baseMed.stock, estimated: 0 },
    };
    const zeroDecrement = decrementStockOnDoseTaken(
      nearZeroMed,
      '2026-11-23T08:00:00Z'
    );
    expect(zeroDecrement.stock.estimated).toBe(0);
  });

  it('replenishes and calibrates stock accurately', () => {
    const replenished = replenishStock(baseMed, 30, '2026-11-23T10:00:00Z');
    expect(replenished.stock.estimated).toBe(50);

    const calibrated = calibrateStock(baseMed, 12, '2026-11-23T11:00:00Z');
    expect(calibrated.stock.estimated).toBe(12);
  });
});
