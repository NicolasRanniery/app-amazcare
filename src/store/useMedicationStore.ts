import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, DoseEvent, DrawerId } from '../domain/types';
import {
  decrementStockOnDoseTaken,
  replenishStock,
  calibrateStock,
} from '../domain/stock';

interface MedicationState {
  medications: Medication[];
  events: DoseEvent[];

  addMedication: (
    med: Omit<Medication, 'id'> & { id?: string }
  ) => Promise<string>;
  updateMedication: (med: Medication) => Promise<void>;
  archiveMedication: (id: string) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;

  recordDoseTaken: (
    medicationId: string,
    scheduledFor: string,
    source?: 'caixa' | 'app',
    amountTaken?: number
  ) => Promise<void>;

  recordDoseMissed: (
    medicationId: string,
    scheduledFor: string,
    source?: 'caixa' | 'app'
  ) => Promise<void>;

  addStockUnits: (medicationId: string, units: number) => Promise<void>;
  setExactStock: (medicationId: string, units: number) => Promise<void>;

  resetDemoData: () => void;
}

export function getDemoMedications(): Medication[] {
  return [
    {
      id: 'med-1',
      name: 'Medicamento A',
      strength: '500 mg',
      dose: { amount: 1, unit: 'comprimido' },
      times: ['08:00'],
      startDate: '2026-01-01',
      endDate: null,
      drawer: 1,
      notes: 'Tomar com um copo cheio de água.',
      stock: {
        estimated: 28,
        minAlert: 6,
        updatedAt: '2026-11-20T08:00:00.000Z',
      },
    },
    {
      id: 'med-4',
      name: 'Medicamento D',
      strength: '25 mg',
      dose: { amount: 1, unit: 'comprimido' },
      times: ['08:00'],
      startDate: '2026-01-01',
      endDate: null,
      drawer: 4,
      notes: 'Tomar junto com o café da manhã.',
      stock: {
        estimated: 14,
        minAlert: 4,
        updatedAt: '2026-11-20T08:00:00.000Z',
      },
    },
    {
      id: 'med-2',
      name: 'Medicamento B',
      strength: '50 mg',
      dose: { amount: 1, unit: 'comprimido' },
      times: ['12:00'],
      startDate: '2026-01-01',
      endDate: null,
      drawer: 2,
      notes: 'Tomar logo após o almoço.',
      stock: {
        estimated: 5,
        minAlert: 5, // Estoque baixo para demonstração!
        updatedAt: '2026-11-20T12:00:00.000Z',
      },
    },
    {
      id: 'med-3',
      name: 'Medicamento C',
      strength: '100 mg',
      dose: { amount: 1, unit: 'comprimido' },
      times: ['20:00'],
      startDate: '2026-01-01',
      endDate: null,
      drawer: 3,
      notes: 'Evitar alimentos pesados antes.',
      stock: {
        estimated: 20,
        minAlert: 4,
        updatedAt: '2026-11-20T20:00:00.000Z',
      },
    },
  ];
}

export function getDemoEvents(): DoseEvent[] {
  const events: DoseEvent[] = [];
  const baseDate = new Date();

  // Gera 6 dias de histórico para o gráfico de adesão
  for (let k = 1; k <= 6; k++) {
    const day = new Date(baseDate.getTime() - k * 86400000);
    const dayStr = day.toISOString().slice(0, 10);

    events.push({
      id: `seed-${k}-1`,
      medicationId: 'med-1',
      scheduledFor: `${dayStr}T08:00:00`,
      status: 'registrada',
      takenAt: `${dayStr}T08:05:00`,
      source: 'caixa',
    });

    events.push({
      id: `seed-${k}-4`,
      medicationId: 'med-4',
      scheduledFor: `${dayStr}T08:00:00`,
      status: 'registrada',
      takenAt: `${dayStr}T08:06:00`,
      source: 'caixa',
    });

    // 1 dia esquecido para demonstração real de adesão < 100%
    const isMissed = k === 3;
    events.push({
      id: `seed-${k}-2`,
      medicationId: 'med-2',
      scheduledFor: `${dayStr}T12:00:00`,
      status: isMissed ? 'esquecida' : 'registrada',
      takenAt: isMissed ? undefined : `${dayStr}T12:10:00`,
      source: 'caixa',
    });

    events.push({
      id: `seed-${k}-3`,
      medicationId: 'med-3',
      scheduledFor: `${dayStr}T20:00:00`,
      status: 'registrada',
      takenAt: `${dayStr}T20:02:00`,
      source: 'caixa',
    });
  }

  return events;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: getDemoMedications(),
      events: getDemoEvents(),

      addMedication: async (medData) => {
        const id = medData.id || `med-${Date.now()}`;
        const newMed: Medication = {
          ...medData,
          id,
        };
        set((state) => ({
          medications: [...state.medications, newMed],
        }));
        return id;
      },

      updateMedication: async (updated) => {
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === updated.id ? updated : m
          ),
        }));
      },

      archiveMedication: async (id) => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, archivedAt: nowIso } : m
          ),
        }));
      },

      deleteMedication: async (id) => {
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
        }));
      },

      recordDoseTaken: async (
        medicationId,
        scheduledFor,
        source = 'app',
        amountTaken
      ) => {
        const nowIso = new Date().toISOString();
        set((state) => {
          // Decrementa estoque
          const updatedMeds = state.medications.map((m) => {
            if (m.id === medicationId) {
              return decrementStockOnDoseTaken(m, nowIso, amountTaken);
            }
            return m;
          });

          // Registra ou atualiza evento
          const existingIndex = state.events.findIndex(
            (ev) =>
              ev.medicationId === medicationId &&
              ev.scheduledFor === scheduledFor
          );

          let updatedEvents = [...state.events];
          if (existingIndex >= 0) {
            updatedEvents[existingIndex] = {
              ...updatedEvents[existingIndex],
              status: 'registrada',
              takenAt: nowIso,
              source,
            };
          } else {
            updatedEvents.push({
              id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              medicationId,
              scheduledFor,
              status: 'registrada',
              takenAt: nowIso,
              source,
            });
          }

          return {
            medications: updatedMeds,
            events: updatedEvents,
          };
        });
      },

      recordDoseMissed: async (
        medicationId,
        scheduledFor,
        source = 'app'
      ) => {
        set((state) => {
          const existingIndex = state.events.findIndex(
            (ev) =>
              ev.medicationId === medicationId &&
              ev.scheduledFor === scheduledFor
          );

          let updatedEvents = [...state.events];
          if (existingIndex >= 0) {
            updatedEvents[existingIndex] = {
              ...updatedEvents[existingIndex],
              status: 'esquecida',
              source,
            };
          } else {
            updatedEvents.push({
              id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              medicationId,
              scheduledFor,
              status: 'esquecida',
              source,
            });
          }

          return { events: updatedEvents };
        });
      },

      addStockUnits: async (medicationId, units) => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === medicationId ? replenishStock(m, units, nowIso) : m
          ),
        }));
      },

      setExactStock: async (medicationId, units) => {
        const nowIso = new Date().toISOString();
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === medicationId ? calibrateStock(m, units, nowIso) : m
          ),
        }));
      },

      resetDemoData: () => {
        set({
          medications: getDemoMedications(),
          events: getDemoEvents(),
        });
      },
    }),
    {
      name: 'amazcare-medications-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
