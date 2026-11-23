import {
  buildClinicalReportData,
  formatReportHtml,
} from '../src/domain/report';
import { Medication, DoseEvent } from '../src/domain/types';

describe('Domain: report.ts (Clinical report data & HTML)', () => {
  const sampleMed: Medication = {
    id: 'med-1',
    name: 'Medicamento A',
    strength: '500 mg',
    dose: { amount: 1, unit: 'comprimido' },
    times: ['08:00'],
    startDate: '2026-11-01',
    endDate: null,
    drawer: 2,
    stock: { estimated: 2, minAlert: 5, updatedAt: '2026-11-01T00:00:00Z' }, // Low stock!
  };

  const now = new Date(2026, 10, 23, 12, 0, 0);

  it('builds clinical report data with stock alerts and missed doses', () => {
    const events: DoseEvent[] = [
      {
        id: 'ev-1',
        medicationId: 'med-1',
        scheduledFor: '2026-11-22T08:00:00',
        status: 'esquecida',
        source: 'caixa',
      },
    ];

    const report = buildClinicalReportData([sampleMed], events, 7, now);
    expect(report.periodDays).toBe(7);
    expect(report.missedDoses.length).toBe(1);
    expect(report.missedDoses[0].medicationName).toBe('Medicamento A');
    expect(report.stockAlerts.length).toBe(1);
    expect(report.stockAlerts[0].status).toBe('baixo');

    const html = formatReportHtml(report);
    expect(html).toContain('Medicamento A');
    expect(html).toContain('Relatório Clínico de Adesão Medicamentosa');
    expect(html).toContain('Gaveta 2');
  });
});
