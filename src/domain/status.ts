import { DoseEvent, DoseStatus, ScheduledDose, Medication } from './types';

export const DEFAULT_TOLERANCE_MINUTES = 60;

export interface StatusCalculationContext {
  now: Date;
  toleranceMinutes?: number;
  activeAlarmMedicationIds?: string[];
  activeAlarmTime?: string;
  activeAlarmDate?: string;
}

/**
 * Converte data (YYYY-MM-DD) e horário (HH:mm) para um objeto Date.
 */
export function parseScheduledDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Formata um objeto Date para "YYYY-MM-DD".
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata um objeto Date para "HH:mm".
 */
export function formatTimeHM(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calcula o status de uma dose em relação ao relógio atual (função pura).
 */
export function calculateDoseStatus(
  scheduled: {
    medicationId: string;
    date: string;
    time: string;
    scheduledFor: string;
  },
  existingEvents: DoseEvent[],
  context: StatusCalculationContext
): { status: DoseStatus; event?: DoseEvent; autoMissed: boolean } {
  const tolerance = context.toleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES;

  // 1. Verifica se já existe um evento registrado ou marcado como esquecido para este horário
  const matchedEvent = existingEvents.find(
    (ev) =>
      ev.medicationId === scheduled.medicationId &&
      ev.scheduledFor === scheduled.scheduledFor
  );

  if (matchedEvent) {
    return {
      status: matchedEvent.status,
      event: matchedEvent,
      autoMissed: false,
    };
  }

  // 2. Verifica se a dose está atualmente em andamento (alarme tocando agora)
  if (
    context.activeAlarmDate === scheduled.date &&
    context.activeAlarmTime === scheduled.time &&
    context.activeAlarmMedicationIds?.includes(scheduled.medicationId)
  ) {
    return {
      status: 'andamento',
      autoMissed: false,
    };
  }

  // 3. Derivação pura do relógio
  const scheduledDate = parseScheduledDate(scheduled.date, scheduled.time);
  const diffMs = context.now.getTime() - scheduledDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  // Antes do horário previsto
  if (diffMinutes < 0) {
    return {
      status: 'pendente',
      autoMissed: false,
    };
  }

  // No horário ou com pequeno atraso dentro da janela de tolerância
  if (diffMinutes <= tolerance) {
    return {
      status: 'atrasada',
      autoMissed: false,
    };
  }

  // Ultrapassou a janela de tolerância: vira esquecida automaticamente!
  return {
    status: 'esquecida',
    autoMissed: true,
  };
}

/**
 * Detecta se uma dose de um medicamento já foi tomada no mesmo dia/horário (Proteção contra repetição indevida).
 */
export function checkDuplicateDose(
  medicationId: string,
  scheduledFor: string,
  events: DoseEvent[]
): { isDuplicate: boolean; lastTakenAt?: string } {
  const existing = events.find(
    (ev) =>
      ev.medicationId === medicationId &&
      ev.scheduledFor === scheduledFor &&
      ev.status === 'registrada'
  );

  if (existing && existing.takenAt) {
    return {
      isDuplicate: true,
      lastTakenAt: existing.takenAt,
    };
  }

  // Verifica também se foi tomado em qualquer horário nas últimas 2 horas
  const scheduledDate = new Date(scheduledFor).getTime();
  const recentTaken = events.find((ev) => {
    if (ev.medicationId !== medicationId || ev.status !== 'registrada' || !ev.takenAt) {
      return false;
    }
    const takenTime = new Date(ev.takenAt).getTime();
    return Math.abs(scheduledDate - takenTime) < 2 * 3600 * 1000;
  });

  if (recentTaken && recentTaken.takenAt) {
    return {
      isDuplicate: true,
      lastTakenAt: recentTaken.takenAt,
    };
  }

  return { isDuplicate: false };
}
