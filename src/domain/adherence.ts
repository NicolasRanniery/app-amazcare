import { Medication, DoseEvent, AdherenceMetrics } from './types';
import { formatDateISO, parseScheduledDate } from './status';
import { isTreatmentActive } from './schedule';

/**
 * Calcula as métricas de adesão do paciente para um determinado período de dias.
 */
export function calculateAdherence(
  medications: Medication[],
  events: DoseEvent[],
  periodDays: number,
  now: Date
): AdherenceMetrics {
  const endDateStr = formatDateISO(now);
  const startDate = new Date(now.getTime() - (periodDays - 1) * 86400000);
  const startDateStr = formatDateISO(startDate);

  // Filtra eventos do período
  const periodEvents = events.filter((ev) => {
    const evDateStr = ev.scheduledFor.slice(0, 10);
    return evDateStr >= startDateStr && evDateStr <= endDateStr;
  });

  const byMedication: AdherenceMetrics['byMedication'] = {};
  for (const med of medications) {
    byMedication[med.id] = {
      medicationName: med.name,
      scheduled: 0,
      taken: 0,
      missed: 0,
      percentage: 100,
    };
  }

  // Gera dias do período
  const dailyBreakdown: AdherenceMetrics['dailyBreakdown'] = [];
  let totalScheduled = 0;
  let totalTaken = 0;
  let totalMissed = 0;

  for (let i = periodDays - 1; i >= 0; i--) {
    const currentDay = new Date(now.getTime() - i * 86400000);
    const dayStr = formatDateISO(currentDay);

    let dayScheduled = 0;
    let dayTaken = 0;

    for (const med of medications) {
      if (isTreatmentActive(med, dayStr)) {
        const dosesCount = med.times.length;
        dayScheduled += dosesCount;
        totalScheduled += dosesCount;

        if (byMedication[med.id]) {
          byMedication[med.id].scheduled += dosesCount;
        }
      }
    }

    // Processa eventos ocorridos neste dia
    const dayEvents = periodEvents.filter(
      (ev) => ev.scheduledFor.slice(0, 10) === dayStr
    );

    for (const ev of dayEvents) {
      if (ev.status === 'registrada') {
        dayTaken += 1;
        totalTaken += 1;
        if (byMedication[ev.medicationId]) {
          byMedication[ev.medicationId].taken += 1;
        }
      } else if (ev.status === 'esquecida') {
        totalMissed += 1;
        if (byMedication[ev.medicationId]) {
          byMedication[ev.medicationId].missed += 1;
        }
      }
    }

    const dayPercentage =
      dayScheduled > 0 ? Math.round((dayTaken / dayScheduled) * 100) : 100;

    dailyBreakdown.push({
      date: dayStr,
      scheduled: dayScheduled,
      taken: dayTaken,
      percentage: Math.min(100, dayPercentage),
    });
  }

  // Calcula percentuais individuais
  for (const medId of Object.keys(byMedication)) {
    const item = byMedication[medId];
    item.percentage =
      item.scheduled > 0
        ? Math.round((item.taken / item.scheduled) * 100)
        : 100;
  }

  const overallPercentage =
    totalScheduled > 0
      ? Math.round((totalTaken / totalScheduled) * 100)
      : 100;

  return {
    totalScheduled,
    totalTaken,
    totalMissed,
    adherencePercentage: Math.min(100, overallPercentage),
    byMedication,
    dailyBreakdown,
  };
}
