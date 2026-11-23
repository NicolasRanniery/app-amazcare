import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderWithSettings } from '../../src/components/HeaderWithSettings';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { ConfirmationModal } from '../../src/components/ConfirmationModal';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { isTreatmentFinished } from '../../src/domain/schedule';
import { formatDateISO } from '../../src/domain/status';
import { Medication } from '../../src/domain/types';

export default function RemediosScreen() {
  const router = useRouter();
  const medications = useMedicationStore((s) => s.medications);
  const archiveMedication = useMedicationStore((s) => s.archiveMedication);
  const deleteMedication = useMedicationStore((s) => s.deleteMedication);
  const getNow = useSettingsStore((s) => s.getNow);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [confirmModal, setConfirmModal] = React.useState<{
    visible: boolean;
    type: 'delete' | 'archive' | 'finished';
    med: Medication | null;
  }>({
    visible: false,
    type: 'delete',
    med: null,
  });

  const todayStr = formatDateISO(getNow());

  const activeMeds = medications.filter((m) => !m.archivedAt);
  const archivedMeds = medications.filter((m) => !!m.archivedAt);

  // Remédios cujo tratamento terminou mas ainda não foram arquivados
  const finishedMeds = activeMeds.filter((m) =>
    isTreatmentFinished(m, todayStr)
  );

  const handleConfirmAction = async () => {
    if (!confirmModal.med) return;
    const { med, type } = confirmModal;

    if (type === 'delete') {
      await deleteMedication(med.id);
    } else if (type === 'archive' || type === 'finished') {
      await archiveMedication(med.id);
    }

    setConfirmModal({ visible: false, type: 'delete', med: null });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings title="Meus Remédios" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botão de adicionar novo remédio */}
        <AccessibleButton
          title="＋ Adicionar Novo Remédio"
          onPress={() => router.push('/remedio/novo')}
          variant="primary"
          size="large"
          accessibilityLabel="Cadastrar um novo remédio na caixa"
        />

        {/* Alerta de tratamentos encerrados (Fim de rotina) */}
        {finishedMeds.map((med) => (
          <View
            key={`fin-${med.id}`}
            style={[
              styles.finishedAlertCard,
              {
                backgroundColor: colors.accentGoldBg,
                borderColor: colors.accentGold,
                borderWidth: colors.borderWidthStrong,
              },
            ]}
          >
            <Text
              style={[
                styles.finishedAlertTitle,
                { color: colors.accentGold, fontSize: scaleFont(20) },
              ]}
            >
              🏁 Tratamento Concluído!
            </Text>
            <Text
              style={[
                styles.finishedAlertText,
                { color: colors.textPrimary, fontSize: scaleFont(18) },
              ]}
            >
              O tratamento de{' '}
              <Text style={{ fontWeight: '800' }}>{med.name}</Text> chegou ao
              fim. Deseja arquivar o remédio e liberar a Gaveta {med.drawer}?
            </Text>
            <AccessibleButton
              title={`Arquivar e liberar Gaveta ${med.drawer}`}
              onPress={() =>
                setConfirmModal({
                  visible: true,
                  type: 'finished',
                  med,
                })
              }
              variant="outline"
              size="normal"
            />
          </View>
        ))}

        {/* Lista de medicamentos ativos */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textPrimary, fontSize: scaleFont(24) },
          ]}
        >
          Medicamentos em Uso ({activeMeds.length})
        </Text>

        {activeMeds.length === 0 ? (
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
                styles.emptyTitle,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Nenhum medicamento cadastrado.
            </Text>
            <Text
              style={[
                styles.emptySub,
                { color: colors.textMuted, fontSize: scaleFont(18) },
              ]}
            >
              Toque no botão verde acima para cadastrar a primeira receita.
            </Text>
          </View>
        ) : (
          activeMeds.map((med) => (
            <View
              key={med.id}
              style={[
                styles.medCard,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.borderSubtle,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.medName,
                    { color: colors.textPrimary, fontSize: scaleFont(24) },
                  ]}
                >
                  {med.name}
                </Text>
                <View
                  style={[
                    styles.drawerBadge,
                    {
                      backgroundColor: colors.primaryBg,
                      borderColor: colors.primary,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerBadgeText,
                      { color: colors.primary, fontSize: scaleFont(16) },
                    ]}
                  >
                    Gaveta {med.drawer}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.strengthText,
                  { color: colors.textMuted, fontSize: scaleFont(19) },
                ]}
              >
                {med.strength} · {med.dose.amount} {med.dose.unit}(s) por dose
              </Text>
              <Text
                style={[
                  styles.timesText,
                  { color: colors.textPrimary, fontSize: scaleFont(18) },
                ]}
              >
                Horários:{' '}
                <Text style={{ fontWeight: '800' }}>{med.times.join(', ')}</Text>
              </Text>

              {med.endDate && (
                <Text
                  style={[
                    styles.datesText,
                    { color: colors.textMuted, fontSize: scaleFont(17) },
                  ]}
                >
                  Término: {med.endDate.split('-').reverse().join('/')}
                </Text>
              )}

              {med.notes ? (
                <Text
                  style={[
                    styles.notesText,
                    { color: colors.textMuted, fontSize: scaleFont(16) },
                  ]}
                >
                  Nota: {med.notes}
                </Text>
              ) : null}

              <View
                style={[
                  styles.stockRow,
                  { borderTopColor: colors.borderSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.stockLabel,
                    { color: colors.textMuted, fontSize: scaleFont(17) },
                  ]}
                >
                  Estoque estimado:{' '}
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                    {med.stock.estimated}
                  </Text>{' '}
                  {med.dose.unit}(s)
                </Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => router.push(`/remedio/${med.id}`)}
                  style={[
                    styles.btnAction,
                    styles.btnEdit,
                    {
                      borderColor: colors.borderStrong,
                      borderWidth: colors.borderWidth,
                      backgroundColor: colors.bgCanvas,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.btnEditText,
                      { color: colors.textPrimary, fontSize: scaleFont(16) },
                    ]}
                  >
                    ✎ Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setConfirmModal({
                      visible: true,
                      type: 'archive',
                      med,
                    })
                  }
                  style={[
                    styles.btnAction,
                    styles.btnArchive,
                    {
                      borderColor: colors.borderSubtle,
                      borderWidth: colors.borderWidth,
                      backgroundColor: colors.bgCanvas,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.btnArchiveText,
                      { color: colors.textMuted, fontSize: scaleFont(16) },
                    ]}
                  >
                    Arquivar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setConfirmModal({
                      visible: true,
                      type: 'delete',
                      med,
                    })
                  }
                  style={[
                    styles.btnAction,
                    styles.btnDelete,
                    {
                      borderColor: colors.urgent,
                      borderWidth: colors.borderWidth,
                      backgroundColor: colors.bgSurface,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.btnDeleteText,
                      { color: colors.urgent, fontSize: scaleFont(16) },
                    ]}
                  >
                    Excluir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Medicamentos arquivados (se houver) */}
        {archivedMeds.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.textPrimary, fontSize: scaleFont(24), marginTop: 24 },
              ]}
            >
              Tratamentos Arquivados ({archivedMeds.length})
            </Text>
            {archivedMeds.map((med) => (
              <View
                key={`arch-${med.id}`}
                style={[
                  styles.archivedCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderSubtle,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.archivedName,
                    { color: colors.textMuted, fontSize: scaleFont(19) },
                  ]}
                >
                  {med.name}
                </Text>
                <Text
                  style={[
                    styles.archivedDetails,
                    { color: colors.textMuted, fontSize: scaleFont(15) },
                  ]}
                >
                  {med.strength} · Arquivado em{' '}
                  {med.archivedAt?.slice(0, 10).split('-').reverse().join('/')}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal de confirmação para exclusão ou arquivamento */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={
          confirmModal.type === 'delete'
            ? `Excluir ${confirmModal.med?.name}?`
            : `Arquivar ${confirmModal.med?.name}?`
        }
        message={
          confirmModal.type === 'delete'
            ? `Essa ação removerá o remédio e a programação da Gaveta ${confirmModal.med?.drawer}. O histórico de doses anteriores continuará salvo.`
            : `Ao arquivar, o remédio deixa de ter alarmes e a Gaveta ${confirmModal.med?.drawer} fica livre para novo uso.`
        }
        confirmLabel={
          confirmModal.type === 'delete' ? 'Sim, excluir' : 'Sim, arquivar'
        }
        cancelLabel="Cancelar"
        isDestructive={confirmModal.type === 'delete'}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ visible: false, type: 'delete', med: null })
        }
      />
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
  finishedAlertCard: {
    backgroundColor: '#FFF3D6',
    borderWidth: 2,
    borderColor: '#8F5300',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  finishedAlertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8F5300',
  },
  finishedAlertText: {
    fontSize: 18,
    color: '#5E3600',
    marginVertical: 8,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C10',
    marginVertical: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A1C10',
  },
  emptySub: {
    fontSize: 18,
    color: '#4A6078',
    textAlign: 'center',
    marginTop: 6,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C10',
  },
  drawerBadge: {
    backgroundColor: '#D8F2E6',
    borderWidth: 1.5,
    borderColor: '#0B5A25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  drawerBadgeText: {
    color: '#0B5A25',
    fontSize: 16,
    fontWeight: '700',
  },
  strengthText: {
    fontSize: 19,
    color: '#2D4233',
    fontWeight: '600',
    marginTop: 4,
  },
  timesText: {
    fontSize: 18,
    color: '#0A1C10',
    marginTop: 4,
  },
  datesText: {
    fontSize: 17,
    color: '#4A6078',
    marginTop: 4,
  },
  notesText: {
    fontSize: 16,
    color: '#4A6078',
    marginTop: 4,
    fontStyle: 'italic',
  },
  stockRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EFE9',
  },
  stockLabel: {
    fontSize: 17,
    color: '#2D4233',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  btnEdit: {
    backgroundColor: '#F4F7F4',
    borderWidth: 1.5,
    borderColor: '#334E39',
  },
  btnEditText: {
    color: '#0A1C10',
    fontSize: 16,
    fontWeight: '700',
  },
  btnArchive: {
    backgroundColor: '#F4F7F4',
    borderWidth: 1.5,
    borderColor: '#CBD7CD',
  },
  btnArchiveText: {
    color: '#4A6078',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDelete: {
    borderWidth: 1.5,
    borderColor: '#A31610',
    backgroundColor: '#FFFFFF',
  },
  btnDeleteText: {
    color: '#A31610',
    fontSize: 16,
    fontWeight: '700',
  },
  archivedCard: {
    backgroundColor: '#F0F3F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  archivedName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#4A6078',
  },
  archivedDetails: {
    fontSize: 15,
    color: '#607D67',
    marginTop: 2,
  },
});
