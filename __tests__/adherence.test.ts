import { calculateAdherence } from '../src/domain/adherence';
import { Medication, DoseEvent } from '../src/domain/types';

describe('Domain: adherence.ts (Adherence metrics)', () => {
  const sampleMed: Medication = {
    id: 'med-1',
    name: 'Medicamento A',
    strength: '500 mg',
    dose: { amount: 1, unit: 'comprimido' },
    times: ['08:00', '20:00'], // 2 doses per day
    startDate: '2026-11-01',
    endDate: null,
    drawer: 1,
    stock: { estimated: 30, minAlert: 5, updatedAt: '2026-11-01T00:00:00Z' },
  };

  const now = new Date(2026, 10, 23, 22, 0, 0); // 2026-11-23

  it('calculates 100% adherence when all doses are taken', () => {
    // 1 day, 2 doses taken
    const events: DoseEvent[] = [
      {
        id: 'ev-1',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T08:00:00',
        status: 'registrada',
        source: 'caixa',
      },
      {
        id: 'ev-2',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T20:00:00',
        status: 'registrada',
        source: 'caixa',
      },
    ];

    const metrics = calculateAdherence([sampleMed], events, 1, now);
    expect(metrics.totalScheduled).toBe(2);
    expect(metrics.totalTaken).toBe(2);
    expect(metrics.adherencePercentage).toBe(100);
    expect(metrics.byMedication['med-1'].percentage).toBe(100);
  });

  it('calculates correct adherence when doses are missed', () => {
    // 1 day, 1 taken, 1 missed
    const events: DoseEvent[] = [
      {
        id: 'ev-1',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T08:00:00',
        status: 'registrada',
        source: 'caixa',
      },
      {
        id: 'ev-2',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T20:00:00',
        status: 'esquecida',
        source: 'caixa',
      },
    ];

    const metrics = calculateAdherence([sampleMed], events, 1, now);
    expect(metrics.totalScheduled).toBe(2);
    expect(metrics.totalTaken).toBe(1);
    expect(metrics.totalMissed).toBe(1);
    expect(metrics.adherencePercentage).toBe(50);
  });

  it('returns daily breakdown array for charts', () => {
    const metrics = calculateAdherence([sampleMed], [], 7, now);
    expect(metrics.dailyBreakdown.length).toBe(7);
    expect(metrics.dailyBreakdown[6].date).toBe('2026-11-23');
  });
});
