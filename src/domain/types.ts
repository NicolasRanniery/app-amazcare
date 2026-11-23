/**
 * AMAZCARE — Modelos e Tipos do Domínio
 * Regras puras sem dependência de React.
 */

export type DrawerId = 1 | 2 | 3 | 4 | 5 | 6;

export const VALID_DRAWERS: readonly DrawerId[] = [1, 2, 3, 4, 5, 6] as const;

export type DoseUnit = 'comprimido' | 'cápsula' | 'gota' | 'ml' | 'outro';

export interface MedicationDose {
  amount: number;
  unit: DoseUnit;
}

export interface MedicationStock {
  estimated: number;
  minAlert: number;
  updatedAt: string; // ISO Date String
}

export interface Medication {
  id: string;
  name: string;
  strength: string; // Ex: "500 mg", "20 ml"
  dose: MedicationDose;
  times: string[]; // Formato "HH:mm", ex: ["08:00", "20:00"]
  startDate: string; // Formato "YYYY-MM-DD"
  endDate: string | null; // Formato "YYYY-MM-DD" ou null (contínuo)
  drawer: DrawerId;
  notes?: string;
  stock: MedicationStock;
  archivedAt?: string | null; // ISO Date String quando arquivado
}

export type DoseStatus =
  | 'pendente'
  | 'andamento'
  | 'registrada'
  | 'atrasada'
  | 'esquecida';

export interface DoseEvent {
  id: string;
  medicationId: string;
  scheduledFor: string; // ISO string do horário programado
  status: DoseStatus;
  takenAt?: string; // ISO string da ingestão confirmada
  source: 'caixa' | 'app';
  drawerOpenedAt?: string;
  drawerClosedAt?: string;
}

export interface ScheduledDose {
  medication: Medication;
  time: string; // "HH:mm"
  date: string; // "YYYY-MM-DD"
  scheduledFor: string; // ISO DateTime
  status: DoseStatus;
  event?: DoseEvent;
}

export interface GroupedDoseMoment {
  time: string; // "HH:mm"
  date: string; // "YYYY-MM-DD"
  doses: ScheduledDose[];
  drawers: DrawerId[];
  isCompleted: boolean;
}

export type StockStatusLevel = 'ok' | 'baixo' | 'esgotado';

export interface StockEstimate {
  medicationId: string;
  medicationName: string;
  estimated: number;
  minAlert: number;
  dailyDoseCount: number;
  dailyAmount: number;
  daysRemaining: number;
  status: StockStatusLevel;
  displayMessage: string;
}

export interface AdherenceMetrics {
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherencePercentage: number;
  byMedication: Record<
    string,
    {
      medicationName: string;
      scheduled: number;
      taken: number;
      missed: number;
      percentage: number;
    }
  >;
  dailyBreakdown: Array<{
    date: string; // YYYY-MM-DD
    scheduled: number;
    taken: number;
    percentage: number;
  }>;
}

export interface ClinicalReportData {
  patientTitle: string;
  generatedAt: string; // ISO
  periodDays: number;
  startDate: string;
  endDate: string;
  metrics: AdherenceMetrics;
  medications: Medication[];
  missedDoses: Array<{
    medicationName: string;
    scheduledFor: string;
    drawer: DrawerId;
  }>;
  stockAlerts: StockEstimate[];
}
