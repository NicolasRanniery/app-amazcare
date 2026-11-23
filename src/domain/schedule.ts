import {
  Medication,
  ScheduledDose,
  GroupedDoseMoment,
  DrawerId,
  DoseStatus,
} from './types';

/**
 * Retorna se o tratamento do medicamento está ativo na data informada (YYYY-MM-DD).
 */
export function isTreatmentActive(med: Medication, dateStr: string): boolean {
  if (med.archivedAt) {
    return false;
  }
  if (med.startDate > dateStr) {
    return false;
  }
  if (med.endDate && med.endDate < dateStr) {
    return false;
  }
  return true;
}

/**
 * Retorna se o tratamento do medicamento já foi concluído (data de término anterior a dateStr).
 */
export function isTreatmentFinished(med: Medication, dateStr: string): boolean {
  if (med.archivedAt) {
    return true;
  }
  if (med.endDate && med.endDate < dateStr) {
    return true;
  }
  return false;
}

/**
 * Gera a lista de doses programadas para uma data específica (YYYY-MM-DD),
 * ordenada cronologicamente por horário.
 */
export function generateDailyDoses(
  medications: Medication[],
  dateStr: string
): Array<Omit<ScheduledDose, 'status' | 'event'>> {
  const result: Array<Omit<ScheduledDose, 'status' | 'event'>> = [];

  for (const med of medications) {
    if (!isTreatmentActive(med, dateStr)) {
      continue;
    }

    for (const time of med.times) {
      result.push({
        medication: med,
        time,
        date: dateStr,
        scheduledFor: `${dateStr}T${time}:00`,
      });
    }
  }

  // Ordena cronologicamente
  return result.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Agrupa doses que coincidem no mesmo horário e data (suporte a polifarmácia).
 */
export function groupDosesByMoment(
  scheduledDoses: ScheduledDose[]
): GroupedDoseMoment[] {
  const momentMap = new Map<string, ScheduledDose[]>();

  for (const dose of scheduledDoses) {
    const key = `${dose.date} ${dose.time}`;
    const list = momentMap.get(key) ?? [];
    list.push(dose);
    momentMap.set(key, list);
  }

  const moments: GroupedDoseMoment[] = [];

  for (const [, doses] of momentMap.entries()) {
    if (doses.length === 0) continue;
    const first = doses[0];
    const drawers: DrawerId[] = Array.from(
      new Set(doses.map((d) => d.medication.drawer))
    );

    const isCompleted = doses.every(
      (d) => d.status === 'registrada' || d.status === 'esquecida'
    );

    moments.push({
      time: first.time,
      date: first.date,
      doses,
      drawers,
      isCompleted,
    });
  }

  return moments.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Localiza o próximo momento de medicação pendente ou em andamento.
 */
export function findNextMoment(
  moments: GroupedDoseMoment[]
): GroupedDoseMoment | null {
  for (const moment of moments) {
    const hasPendingOrActive = moment.doses.some(
      (d) =>
        d.status === 'pendente' ||
        d.status === 'andamento' ||
        d.status === 'atrasada'
    );
    if (hasPendingOrActive) {
      return moment;
    }
  }
  return null;
}
