import {
  generateDailyDoses,
  groupDosesByMoment,
  isTreatmentActive,
  isTreatmentFinished,
  findNextMoment,
} from '../src/domain/schedule';
import { Medication, ScheduledDose } from '../src/domain/types';

describe('Domain: schedule.ts', () => {
  const sampleMed1: Medication = {
    id: 'med-1',
    name: 'Medicamento A',
    strength: '500 mg',
    dose: { amount: 1, unit: 'comprimido' },
    times: ['08:00', '20:00'],
    startDate: '2026-11-20',
    endDate: '2026-11-30',
    drawer: 1,
    stock: { estimated: 20, minAlert: 5, updatedAt: '2026-11-20T00:00:00Z' },
  };

  const sampleMed2: Medication = {
    id: 'med-2',
    name: 'Medicamento B',
    strength: '50 mg',
    dose: { amount: 2, unit: 'comprimido' },
    times: ['08:00'],
    startDate: '2026-11-20',
    endDate: null,
    drawer: 4,
    stock: { estimated: 15, minAlert: 4, updatedAt: '2026-11-20T00:00:00Z' },
  };

  const archivedMed: Medication = {
    ...sampleMed1,
    id: 'med-archived',
    archivedAt: '2026-11-22T10:00:00Z',
  };

  it('determines if treatment is active or finished correctly', () => {
    expect(isTreatmentActive(sampleMed1, '2026-11-21')).toBe(true);
    expect(isTreatmentActive(sampleMed1, '2026-11-19')).toBe(false);
    expect(isTreatmentActive(sampleMed1, '2026-12-01')).toBe(false);
    expect(isTreatmentActive(archivedMed, '2026-11-21')).toBe(false);

    expect(isTreatmentFinished(sampleMed1, '2026-12-01')).toBe(true);
    expect(isTreatmentFinished(sampleMed1, '2026-11-25')).toBe(false);
    expect(isTreatmentFinished(archivedMed, '2026-11-21')).toBe(true);
  });

  it('generates daily doses sorted chronologically', () => {
    const doses = generateDailyDoses([sampleMed1, sampleMed2], '2026-11-23');
    expect(doses.length).toBe(3); // 2 for med1, 1 for med2

    // Both at 08:00 should come first
    expect(doses[0].time).toBe('08:00');
    expect(doses[1].time).toBe('08:00');
    expect(doses[2].time).toBe('20:00');
  });

  it('groups multiple medications scheduled for the exact same time (polypharmacy)', () => {
    const rawDoses = generateDailyDoses([sampleMed1, sampleMed2], '2026-11-23');
    const scheduledDoses: ScheduledDose[] = rawDoses.map((d) => ({
      ...d,
      status: 'pendente',
    }));

    const moments = groupDosesByMoment(scheduledDoses);
    expect(moments.length).toBe(2); // 08:00 and 20:00

    const morningMoment = moments.find((m) => m.time === '08:00');
    expect(morningMoment).toBeDefined();
    expect(morningMoment?.doses.length).toBe(2);
    expect(morningMoment?.drawers).toEqual(expect.arrayContaining([1, 4]));
    expect(morningMoment?.isCompleted).toBe(false);

    const eveningMoment = moments.find((m) => m.time === '20:00');
    expect(eveningMoment).toBeDefined();
    expect(eveningMoment?.doses.length).toBe(1);
    expect(eveningMoment?.drawers).toEqual([1]);
  });

  it('finds the next pending dose moment', () => {
    const scheduledDoses: ScheduledDose[] = [
      {
        medication: sampleMed1,
        time: '08:00',
        date: '2026-11-23',
        scheduledFor: '2026-11-23T08:00:00',
        status: 'registrada',
      },
      {
        medication: sampleMed1,
        time: '20:00',
        date: '2026-11-23',
        scheduledFor: '2026-11-23T20:00:00',
        status: 'pendente',
      },
    ];

    const moments = groupDosesByMoment(scheduledDoses);
    const next = findNextMoment(moments);
    expect(next?.time).toBe('20:00');
  });
});
