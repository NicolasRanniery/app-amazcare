import { ClinicalReportData, Medication, DoseEvent } from './types';
import { calculateAdherence } from './adherence';
import { calculateStockEstimate } from './stock';
import { formatDateISO } from './status';

/**
 * Monta o objeto de dados clínicos estruturados para o relatório.
 */
export function buildClinicalReportData(
  medications: Medication[],
  events: DoseEvent[],
  periodDays: number,
  now: Date,
  patientName: string = 'Paciente AMAZCARE'
): ClinicalReportData {
  const metrics = calculateAdherence(medications, events, periodDays, now);
  const endDate = formatDateISO(now);
  const startDate = formatDateISO(
    new Date(now.getTime() - (periodDays - 1) * 86400000)
  );

  // Doses esquecidas no período
  const missedEvents = events.filter((ev) => {
    const d = ev.scheduledFor.slice(0, 10);
    return ev.status === 'esquecida' && d >= startDate && d <= endDate;
  });

  const missedDoses = missedEvents.map((ev) => {
    const med = medications.find((m) => m.id === ev.medicationId);
    return {
      medicationName: med?.name ?? 'Medicamento não identificado',
      scheduledFor: ev.scheduledFor,
      drawer: med?.drawer ?? 1,
    };
  });

  // Alertas de estoque crítico
  const stockAlerts = medications
    .map((m) => calculateStockEstimate(m))
    .filter((stk) => stk.status !== 'ok');

  return {
    patientTitle: patientName,
    generatedAt: now.toISOString(),
    periodDays,
    startDate,
    endDate,
    metrics,
    medications,
    missedDoses,
    stockAlerts,
  };
}

/**
 * Converte o relatório clínico em HTML semântico com estilo limpo para impressão em PDF.
 */
export function formatReportHtml(report: ClinicalReportData): string {
  const formattedGenDate = new Date(report.generatedAt).toLocaleString(
    'pt-BR',
    {
      dateStyle: 'long',
      timeStyle: 'short',
    }
  );

  const medsRows = report.medications
    .map((m) => {
      const metric = report.metrics.byMedication[m.id];
      const adherence = metric ? `${metric.percentage}%` : 'N/D';
      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${m.name}</strong> (${m.strength})</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">Gaveta ${m.drawer}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${m.dose.amount} ${m.dose.unit}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${m.times.join(', ')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${
          metric && metric.percentage < 80 ? '#A31610' : '#0B5A25'
        };">${adherence}</td>
      </tr>
    `;
    })
    .join('');

  const missedRows =
    report.missedDoses.length === 0
      ? '<p style="color: #0B5A25; font-weight: bold;">Nenhuma dose esquecida no período avaliado. Excelente adesão!</p>'
      : `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #FDE8E7; color: #A31610; text-align: left;">
            <th style="padding: 8px;">Medicamento</th>
            <th style="padding: 8px;">Gaveta</th>
            <th style="padding: 8px;">Horário Programado</th>
          </tr>
        </thead>
        <tbody>
          ${report.missedDoses
            .map(
              (d) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.medicationName}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Gaveta ${d.drawer}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.scheduledFor.replace('T', ' às ')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>AMAZCARE — Relatório de Adesão</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #10243A;
      margin: 30px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #0B5A25;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .header h1 {
      margin: 0;
      color: #0B5A25;
      font-size: 24px;
    }
    .card {
      background: #F4F7F4;
      border: 1px solid #CBD7CD;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .stat {
      font-size: 36px;
      font-weight: bold;
      color: #0B5A25;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #E8EFE9;
      padding: 10px;
      text-align: left;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AMAZCARE — Relatório Clínico de Adesão Medicamentosa</h1>
    <p>Paciente: <strong>${report.patientTitle}</strong> | Período: <strong>${report.startDate} a ${report.endDate} (${report.periodDays} dias)</strong></p>
    <p style="font-size: 13px; color: #4A6078;">Emitido em: ${formattedGenDate}</p>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <p style="margin: 0; font-size: 16px;">Taxa Global de Adesão no Período:</p>
        <div class="stat">${report.metrics.adherencePercentage}%</div>
      </div>
      <div>
        <p style="margin: 2px 0;">Doses Programadas: <strong>${report.metrics.totalScheduled}</strong></p>
        <p style="margin: 2px 0; color: #0B5A25;">Doses Registradas: <strong>${report.metrics.totalTaken}</strong></p>
        <p style="margin: 2px 0; color: #A31610;">Doses Esquecidas: <strong>${report.metrics.totalMissed}</strong></p>
      </div>
    </div>
  </div>

  <h2>1. Medicamentos Prescritos e Adesão Individual</h2>
  <table>
    <thead>
      <tr>
        <th>Medicamento</th>
        <th>Gaveta</th>
        <th>Posologia</th>
        <th>Horários</th>
        <th>Adesão</th>
      </tr>
    </thead>
    <tbody>
      ${medsRows}
    </tbody>
  </table>

  <h2 style="margin-top: 30px;">2. Ocorrências de Esquecimento</h2>
  ${missedRows}

  <h2 style="margin-top: 30px;">3. Situação do Estoque nas Gavetas</h2>
  ${
    report.stockAlerts.length === 0
      ? '<p style="color: #0B5A25;">Todos os medicamentos possuem estoque satisfatório.</p>'
      : `<ul>${report.stockAlerts
          .map(
            (s) =>
              `<li><strong>${s.medicationName}:</strong> ${s.displayMessage}</li>`
          )
          .join('')}</ul>`
  }

  <div class="footer">
    <p>Relatório gerado automaticamente pelo aplicativo AMAZCARE em conjunto com o gaveteiro inteligente (ESP32 + RTC DS3231). Os registros de abertura/fechamento de gaveta e confirmação do paciente servem de apoio à decisão clínica e monitoramento de idosos sob polifarmácia.</p>
  </div>
</body>
</html>
  `;
}
