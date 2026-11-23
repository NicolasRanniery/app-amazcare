import {
  calculateDoseStatus,
  checkDuplicateDose,
  parseScheduledDate,
} from '../src/domain/status';
import { DoseEvent } from '../src/domain/types';

describe('Domain: status.ts (Clock-derived pure status logic)', () => {
  const scheduledItem = {
    medicationId: 'med-1',
    date: '2026-11-23',
    time: '08:00',
    scheduledFor: '2026-11-23T08:00:00',
  };

  it('marks as pendente when current clock is before scheduled time', () => {
    const now = new Date(2026, 10, 23, 7, 45, 0); // 07:45
    const res = calculateDoseStatus(scheduledItem, [], { now });
    expect(res.status).toBe('pendente');
    expect(res.autoMissed).toBe(false);
  });

  it('marks as atrasada when current clock is within tolerance (e.g. 20 min after)', () => {
    const now = new Date(2026, 10, 23, 8, 20, 0); // 08:20 (scheduled for 08:00)
    const res = calculateDoseStatus(scheduledItem, [], {
      now,
      toleranceMinutes: 60,
    });
    expect(res.status).toBe('atrasada');
    expect(res.autoMissed).toBe(false);
  });

  it('marks as andamento when alarm is currently active for this dose', () => {
    const now = new Date(2026, 10, 23, 8, 5, 0);
    const res = calculateDoseStatus(scheduledItem, [], {
      now,
      activeAlarmDate: '2026-11-23',
      activeAlarmTime: '08:00',
      activeAlarmMedicationIds: ['med-1'],
    });
    expect(res.status).toBe('andamento');
  });

  it('automatically transitions to esquecida when tolerance window expires (e.g. 70 min after with 60 min tolerance)', () => {
    const now = new Date(2026, 10, 23, 9, 15, 0); // 09:15 (75 minutes after 08:00)
    const res = calculateDoseStatus(scheduledItem, [], {
      now,
      toleranceMinutes: 60,
    });
    expect(res.status).toBe('esquecida');
    expect(res.autoMissed).toBe(true);
  });

  it('respects existing event status if already recorded', () => {
    const now = new Date(2026, 10, 23, 14, 0, 0);
    const existingEvents: DoseEvent[] = [
      {
        id: 'ev-1',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T08:00:00',
        status: 'registrada',
        takenAt: '2026-11-23T08:05:00',
        source: 'caixa',
      },
    ];

    const res = calculateDoseStatus(scheduledItem, existingEvents, { now });
    expect(res.status).toBe('registrada');
    expect(res.event?.id).toBe('ev-1');
  });

  it('detects duplicate dose to prevent double dosing (repetição indevida)', () => {
    const events: DoseEvent[] = [
      {
        id: 'ev-1',
        medicationId: 'med-1',
        scheduledFor: '2026-11-23T08:00:00',
        status: 'registrada',
        takenAt: '2026-11-23T08:02:15',
        source: 'caixa',
      },
    ];

    const duplicateCheck = checkDuplicateDose(
      'med-1',
      '2026-11-23T08:00:00',
      events
    );
    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.lastTakenAt).toBe('2026-11-23T08:02:15');

    const noDuplicate = checkDuplicateDose(
      'med-2',
      '2026-11-23T08:00:00',
      events
    );
    expect(noDuplicate.isDuplicate).toBe(false);
  });
});
