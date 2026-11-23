import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { HeaderWithSettings } from '../../src/components/HeaderWithSettings';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { calculateAdherence } from '../../src/domain/adherence';
import {
  buildClinicalReportData,
  formatReportHtml,
} from '../../src/domain/report';
import { pdfService } from '../../src/services/pdfService';
import { formatDateISO } from '../../src/domain/status';
import { DoseEvent, Medication } from '../../src/domain/types';

export default function HistoricoScreen() {
  const medications = useMedicationStore((s) => s.medications);
  const events = useMedicationStore((s) => s.events);
  const getNow = useSettingsStore((s) => s.getNow);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [selectedMedId, setSelectedMedId] = React.useState<string>('all');
  const [periodDays, setPeriodDays] = React.useState<number>(7);
  const [generatingPdf, setGeneratingPdf] = React.useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = React.useState<string>('');

  const now = getNow();

  // Filtra medicamentos para cálculo
  const filteredMeds =
    selectedMedId === 'all'
      ? medications
      : medications.filter((m) => m.id === selectedMedId);

  const filteredEvents =
    selectedMedId === 'all'
      ? events
      : events.filter((ev) => ev.medicationId === selectedMedId);

  const metrics = calculateAdherence(filteredMeds, filteredEvents, periodDays, now);

  // Ordena eventos do mais recente para o mais antigo
  const sortedEvents = [...filteredEvents].sort((a, b) =>
    b.scheduledFor.localeCompare(a.scheduledFor)
  );

  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);
      setPdfSuccessMessage('');
      const reportData = buildClinicalReportData(
        medications,
        events,
        periodDays,
        now
      );
      const html = formatReportHtml(reportData);
      await pdfService.generateAndSharePdf(html);
      setPdfSuccessMessage('Relatório em PDF gerado com sucesso!');
      setTimeout(() => setPdfSuccessMessage(''), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings title="Histórico e Adesão" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Seletor de Período */}
        <Text
          style={[
            styles.filterLabel,
            { color: colors.textPrimary, fontSize: scaleFont(18) },
          ]}
        >
          Período de análise:
        </Text>
        <View style={styles.periodRow}>
          {[
            { label: 'Hoje', days: 1 },
            { label: '7 dias', days: 7 },
            { label: '30 dias', days: 30 },
          ].map((p) => {
            const isSelected = periodDays === p.days;
            return (
              <TouchableOpacity
                key={p.days}
                onPress={() => setPeriodDays(p.days)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.bgSurface,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.borderSubtle,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${p.label}`}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontSize: scaleFont(17),
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Seletor de Medicamento */}
        <Text
          style={[
            styles.filterLabel,
            { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 12 },
          ]}
        >
          Filtrar por remédio:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.medFilterScroll}
        >
          <TouchableOpacity
            onPress={() => setSelectedMedId('all')}
            style={[
              styles.medFilterChip,
              {
                backgroundColor:
                  selectedMedId === 'all'
                    ? colors.borderStrong
                    : colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.medFilterText,
                {
                  color:
                    selectedMedId === 'all' ? '#FFFFFF' : colors.textPrimary,
                  fontSize: scaleFont(16),
                },
              ]}
            >
              Todos os remédios
            </Text>
          </TouchableOpacity>
          {medications.map((m) => {
            const isSelected = selectedMedId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelectedMedId(m.id)}
                style={[
                  styles.medFilterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.borderStrong
                      : colors.bgSurface,
                    borderColor: colors.borderSubtle,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.medFilterText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontSize: scaleFont(16),
                    },
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Card Principal de Adesão */}
        <View
          style={[
            styles.adherenceCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.adherenceSub,
              { color: colors.textMuted, fontSize: scaleFont(18) },
            ]}
          >
            Adesão no Período:
          </Text>
          <Text
            style={[
              styles.adherencePercentage,
              {
                color:
                  metrics.adherencePercentage >= 80
                    ? colors.primary
                    : colors.accentGold,
                fontSize: scaleFont(54),
              },
            ]}
          >
            {metrics.adherencePercentage}%
          </Text>
          <Text
            style={[
              styles.adherenceStats,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            {metrics.totalTaken} de {metrics.totalScheduled} doses tomadas
          </Text>
          {metrics.totalMissed > 0 && (
            <Text
              style={[
                styles.missedStats,
                { color: colors.urgent, fontSize: scaleFont(17) },
              ]}
            >
              {metrics.totalMissed} dose
              {metrics.totalMissed === 1 ? '' : 's'} esquecida
              {metrics.totalMissed === 1 ? '' : 's'}
            </Text>
          )}

          {/* Gráfico diário simplificado em barras (7 dias) */}
          {metrics.dailyBreakdown.length > 0 && (
            <View
              style={[
                styles.chartContainer,
                { borderTopColor: colors.borderSubtle },
              ]}
            >
              <Text
                style={[
                  styles.chartTitle,
                  { color: colors.textMuted, fontSize: scaleFont(16) },
                ]}
              >
                Adesão diária (%):
              </Text>
              <View style={styles.barGraph}>
                {metrics.dailyBreakdown.map((item) => {
                  const dayLabel = item.date.slice(8, 10);
                  const barHeight = Math.max(8, item.percentage * 0.9);
                  return (
                    <View key={item.date} style={styles.barColumn}>
                      <Text
                        style={[
                          styles.barPercent,
                          { color: colors.textMuted, fontSize: scaleFont(12) },
                        ]}
                      >
                        {item.percentage}%
                      </Text>
                      <View
                        style={[
                          styles.barTrack,
                          {
                            backgroundColor: isHighContrast
                              ? '#E0E0E0'
                              : '#E8EFE9',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.barPillar,
                            {
                              height: barHeight,
                              backgroundColor:
                                item.percentage >= 80
                                  ? colors.primary
                                  : colors.accentGold,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barDate,
                          {
                            color: colors.textPrimary,
                            fontSize: scaleFont(14),
                          },
                        ]}
                      >
                        {dayLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Botão de Exportar Relatório em PDF */}
        <AccessibleButton
          title={
            generatingPdf
              ? 'Gerando Relatório...'
              : '📄 Gerar Relatório Médico em PDF'
          }
          onPress={handleGeneratePdf}
          variant="secondary"
          size="large"
          loading={generatingPdf}
          accessibilityLabel="Exportar relatório de adesão em arquivo PDF para médicos"
        />

        {pdfSuccessMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✔ {pdfSuccessMessage}</Text>
          </View>
        ) : null}

        {/* Registro cronológico de doses tomadas / esquecidas */}
        <Text
          style={[
            styles.logHeader,
            { color: colors.textPrimary, fontSize: scaleFont(24) },
          ]}
        >
          Histórico Detalhado
        </Text>

        {sortedEvents.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.emptyText,
                { color: colors.textMuted, fontSize: scaleFont(18) },
              ]}
            >
              Nenhum evento registrado neste filtro.
            </Text>
          </View>
        ) : (
          sortedEvents.map((ev) => {
            const med = medications.find((m) => m.id === ev.medicationId);
            const isTaken = ev.status === 'registrada';
            const dateStr = ev.scheduledFor.slice(0, 10).split('-').reverse().join('/');
            const timeStr = ev.scheduledFor.slice(11, 16);

            return (
              <View
                key={ev.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderSubtle,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <View style={styles.eventInfo}>
                  <Text
                    style={[
                      styles.eventMedName,
                      { color: colors.textPrimary, fontSize: scaleFont(20) },
                    ]}
                  >
                    {med?.name || 'Medicamento'}
                  </Text>
                  <Text
                    style={[
                      styles.eventTime,
                      { color: colors.textMuted, fontSize: scaleFont(16) },
                    ]}
                  >
                    {dateStr} às {timeStr}
                    {ev.takenAt
                      ? ` (registrado às ${ev.takenAt.slice(11, 16)})`
                      : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.eventChip,
                    {
                      backgroundColor: isTaken
                        ? colors.primaryBg
                        : colors.urgentBg,
                      borderColor: isTaken ? colors.primary : colors.urgent,
                      borderWidth: isHighContrast ? 2 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventChipText,
                      {
                        color: isTaken ? colors.primary : colors.urgent,
                        fontSize: scaleFont(15),
                      },
                    ]}
                  >
                    {isTaken ? '✔ Tomado' : '✖ Esquecido'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F4',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1C10',
    marginBottom: 6,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  periodChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodChipSelected: {
    backgroundColor: '#0B5A25',
    borderColor: '#0B5A25',
  },
  periodChipText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A1C10',
  },
  periodChipTextSelected: {
    color: '#FFFFFF',
  },
  medFilterScroll: {
    marginBottom: 14,
  },
  medFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    minHeight: 46,
    justifyContent: 'center',
  },
  medFilterChipSelected: {
    backgroundColor: '#334E39',
    borderColor: '#334E39',
  },
  medFilterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1C10',
  },
  medFilterTextSelected: {
    color: '#FFFFFF',
  },
  adherenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  adherenceSub: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A6078',
  },
  adherencePercentage: {
    fontSize: 54,
    fontWeight: '800',
    marginVertical: 4,
  },
  adherenceStats: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A1C10',
  },
  missedStats: {
    fontSize: 17,
    fontWeight: '700',
    color: '#A31610',
    marginTop: 2,
  },
  chartContainer: {
    width: '100%',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E8EFE9',
    paddingTop: 14,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A6078',
    marginBottom: 8,
  },
  barGraph: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A6078',
    marginBottom: 2,
  },
  barTrack: {
    height: 90,
    justifyContent: 'flex-end',
  },
  barPillar: {
    width: 20,
    borderRadius: 6,
  },
  barDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1C10',
    marginTop: 4,
  },
  successBox: {
    backgroundColor: '#D8F2E6',
    borderWidth: 1.5,
    borderColor: '#0B5A25',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  successText: {
    color: '#0B5A25',
    fontSize: 17,
    fontWeight: '700',
  },
  logHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C10',
    marginTop: 16,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#4A6078',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD7CD',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventMedName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A1C10',
  },
  eventTime: {
    fontSize: 16,
    color: '#4A6078',
    marginTop: 2,
  },
  eventChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  eventChipText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
