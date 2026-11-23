import { Medication, StockEstimate, StockStatusLevel } from './types';

/**
 * Calcula a estimativa de estoque, autonomia em dias e status de um medicamento.
 */
export function calculateStockEstimate(medication: Medication): StockEstimate {
  const dailyDoseCount = medication.times.length;
  const amountPerDose = medication.dose.amount || 1;
  const dailyAmount = dailyDoseCount * amountPerDose;

  const estimated = Math.max(0, medication.stock.estimated);
  const minAlert = Math.max(0, medication.stock.minAlert);

  let daysRemaining = 0;
  if (dailyAmount > 0) {
    daysRemaining = Math.floor(estimated / dailyAmount);
  }

  let status: StockStatusLevel = 'ok';
  let displayMessage = '';

  if (estimated <= 0) {
    status = 'esgotado';
    displayMessage = 'Estoque esgotado. Reabasteça a gaveta.';
  } else if (estimated <= minAlert) {
    status = 'baixo';
    displayMessage = `Estoque baixo: restam ${estimated} ${medication.dose.unit}(s) (dá para ~${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}).`;
  } else {
    status = 'ok';
    displayMessage = `Estoque suficiente: restam ${estimated} ${medication.dose.unit}(s) (dá para ~${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}).`;
  }

  return {
    medicationId: medication.id,
    medicationName: medication.name,
    estimated,
    minAlert,
    dailyDoseCount,
    dailyAmount,
    daysRemaining,
    status,
    displayMessage,
  };
}

/**
 * Decrementa o estoque quando uma dose for tomada.
 */
export function decrementStockOnDoseTaken(
  medication: Medication,
  nowIso: string,
  amountToDecrement?: number
): Medication {
  const decrement = amountToDecrement ?? (medication.dose.amount || 1);
  const newEstimated = Math.max(0, medication.stock.estimated - decrement);

  return {
    ...medication,
    stock: {
      ...medication.stock,
      estimated: newEstimated,
      updatedAt: nowIso,
    },
  };
}

/**
 * Adiciona unidades ao estoque (reabastecimento).
 */
export function replenishStock(
  medication: Medication,
  unitsAdded: number,
  nowIso: string
): Medication {
  const validAdd = Math.max(0, unitsAdded);
  return {
    ...medication,
    stock: {
      ...medication.stock,
      estimated: medication.stock.estimated + validAdd,
      updatedAt: nowIso,
    },
  };
}

/**
 * Corrige manualmente o estoque atual (calibração).
 */
export function calibrateStock(
  medication: Medication,
  exactQuantity: number,
  nowIso: string
): Medication {
  const validQuantity = Math.max(0, exactQuantity);
  return {
    ...medication,
    stock: {
      ...medication.stock,
      estimated: validQuantity,
      updatedAt: nowIso,
    },
  };
}
