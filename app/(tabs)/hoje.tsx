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
import { BoxCabinetMap } from '../../src/components/BoxCabinetMap';
import { DoseTimelineItem } from '../../src/components/DoseTimelineItem';
import { ConfirmationModal } from '../../src/components/ConfirmationModal';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useDeviceStore } from '../../src/store/useDeviceStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import {
  generateDailyDoses,
  groupDosesByMoment,
  findNextMoment,
} from '../../src/domain/schedule';
import {
  calculateDoseStatus,
  formatDateISO,
  checkDuplicateDose,
} from '../../src/domain/status';
import { DrawerId, ScheduledDose } from '../../src/domain/types';

export default function HojeScreen() {
  const router = useRouter();
  const medications = useMedicationStore((s) => s.medications);
  const events = useMedicationStore((s) => s.events);
  const recordDoseTaken = useMedicationStore((s) => s.recordDoseTaken);
  const recordDoseMissed = useMedicationStore((s) => s.recordDoseMissed);

  const deviceStatus = useDeviceStore((s) => s.status);
  const activeAlarm = useDeviceStore((s) => s.activeAlarm);

  const getNow = useSettingsStore((s) => s.getNow);
  const toleranceMinutes = useSettingsStore((s) => s.toleranceMinutes);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [confirmModal, setConfirmModal] = React.useState<{
    visible: boolean;
    type: 'take' | 'miss' | 'duplicate';
    dose: ScheduledDose | null;
    duplicateTime?: string;
  }>({
    visible: false,
    type: 'take',
    dose: null,
  });

  const now = getNow();
  const todayStr = formatDateISO(now);
  const hours = now.getHours();

  const greeting =
    hours < 12
      ? 'Bom dia!'
      : hours < 18
      ? 'Boa tarde!'
      : 'Boa noite!';

  // Doses programadas para o dia
  const dailyRaw = generateDailyDoses(medications, todayStr);
  const scheduledDoses: ScheduledDose[] = dailyRaw.map((d) => {
    const { status, event } = calculateDoseStatus(
      {
        medicationId: d.medication.id,
        date: d.date,
        time: d.time,
        scheduledFor: d.scheduledFor,
      },
      events,
      {
        now,
        toleranceMinutes,
        activeAlarmDate: activeAlarm?.date,
        activeAlarmTime: activeAlarm?.time,
        activeAlarmMedicationIds: activeAlarm?.medicationIds,
      }
    );
    return {
      ...d,
      status,
      event,
    };
  });

  const moments = groupDosesByMoment(scheduledDoses);
  const nextMoment = findNextMoment(moments);

  // Mapeia gavetas para o BoxCabinetMap
  const drawersMap: Record<
    DrawerId,
    { isOpen: boolean; led: any; medicationName?: string }
  > = {
    1: { isOpen: false, led: 'off' },
    2: { isOpen: false, led: 'off' },
    3: { isOpen: false, led: 'off' },
    4: { isOpen: false, led: 'off' },
    5: { isOpen: false, led: 'off' },
    6: { isOpen: false, led: 'off' },
  };

  for (const med of medications) {
    if (!med.archivedAt && drawersMap[med.drawer]) {
      drawersMap[med.drawer].medicationName = med.name;
    }
  }

  for (const id of [1, 2, 3, 4, 5, 6] as DrawerId[]) {
    drawersMap[id].isOpen = deviceStatus.drawers[id]?.open ?? false;
    drawersMap[id].led = deviceStatus.drawers[id]?.led ?? 'off';
  }

  const handleTakePress = (dose: ScheduledDose) => {
    // Verifica repetição indevida
    const dup = checkDuplicateDose(
      dose.medication.id,
      dose.scheduledFor,
      events
    );
    if (dup.isDuplicate) {
      setConfirmModal({
        visible: true,
        type: 'duplicate',
        dose,
        duplicateTime: dup.lastTakenAt?.slice(11, 16),
      });
      return;
    }

    setConfirmModal({
      visible: true,
      type: 'take',
      dose,
    });
  };

  const handleMissPress = (dose: ScheduledDose) => {
    setConfirmModal({
      visible: true,
      type: 'miss',
      dose,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.dose) return;
    const { dose, type } = confirmModal;

    if (type === 'take' || type === 'duplicate') {
      await recordDoseTaken(dose.medication.id, dose.scheduledFor, 'app');
    } else if (type === 'miss') {
      await recordDoseMissed(dose.medication.id, dose.scheduledFor, 'app');
    }

    setConfirmModal({ visible: false, type: 'take', dose: null });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de status da caixa */}
        <View
          style={[
            styles.deviceBanner,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <View style={styles.deviceStatusRow}>
            <View
              style={[
                styles.deviceStatusDot,
                {
                  backgroundColor: deviceStatus.online
                    ? colors.primary
                    : colors.urgent,
                },
              ]}
            />
            <Text
              style={[
                styles.deviceStatusText,
                { color: colors.textPrimary, fontSize: scaleFont(16) },
              ]}
            >
              Caixa AMAZCARE:{' '}
              <Text style={{ fontWeight: '800' }}>
                {deviceStatus.online ? 'Conectada ao Wi-Fi' : 'Desconectada'}
              </Text>
            </Text>
          </View>
          <Text
            style={[
              styles.syncText,
              { color: colors.textMuted, fontSize: scaleFont(14) },
            ]}
          >
            Última sincronização:{' '}
            {deviceStatus.lastSyncAt
              ? new Date(deviceStatus.lastSyncAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Nenhuma'}
          </Text>
        </View>

        {/* Alerta ativo em tela inicial se existir */}
        {activeAlarm && (
          <TouchableOpacity
            onPress={() => router.push('/alerta')}
            style={[
              styles.activeAlarmBanner,
              {
                backgroundColor: colors.accentGoldBg,
                borderColor: colors.accentGold,
                borderWidth: colors.borderWidthStrong,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={[
                styles.alarmBannerTitle,
                { color: colors.accentGold, fontSize: scaleFont(20) },
              ]}
            >
              ⏰ HORA DO REMÉDIO EM ANDAMENTO
            </Text>
            <Text
              style={[
                styles.alarmBannerSub,
                { color: colors.textPrimary, fontSize: scaleFont(17) },
              ]}
            >
              Abra a gaveta indicada na caixa. Toque aqui para abrir a tela de
              alerta.
            </Text>
          </TouchableOpacity>
        )}

        {/* Saudação */}
        <Text
          style={[
            styles.greetingTitle,
            { color: colors.textPrimary, fontSize: scaleFont(30) },
          ]}
        >
          {greeting}
        </Text>

        {/* Próximo momento */}
        <View
          style={[
            styles.nextHeroCard,
            {
              backgroundColor: colors.primary,
              borderColor: isHighContrast ? '#000000' : 'transparent',
              borderWidth: isHighContrast ? 3 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.heroSubHeader,
              { fontSize: scaleFont(18), color: colors.primaryBg },
            ]}
          >
            Próximo medicamento
          </Text>
          {nextMoment ? (
            <>
              <Text
                style={[
                  styles.heroTime,
                  { fontSize: scaleFont(32) },
                ]}
              >
                às {nextMoment.time}
              </Text>
              {nextMoment.doses.map((d) => (
                <View key={d.medication.id} style={styles.nextMedRow}>
                  <Text
                    style={[
                      styles.nextMedName,
                      { fontSize: scaleFont(24) },
                    ]}
                  >
                    {d.medication.name}
                  </Text>
                  <Text
                    style={[
                      styles.nextMedDetails,
                      { fontSize: scaleFont(18), color: colors.primaryBg },
                    ]}
                  >
                    {d.medication.strength} · {d.medication.dose.amount}{' '}
                    {d.medication.dose.unit}(s)
                  </Text>
                  <Text
                    style={[
                      styles.nextMedDrawer,
                      { fontSize: scaleFont(20) },
                    ]}
                  >
                    📦 Abra a Gaveta {d.medication.drawer}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <View style={{ marginVertical: 8 }}>
              <Text
                style={[
                  styles.allDoneTitle,
                  { fontSize: scaleFont(24) },
                ]}
              >
                Tudo tomado por hoje!
              </Text>
              <Text
                style={[
                  styles.allDoneSub,
                  { fontSize: scaleFont(18), color: colors.primaryBg },
                ]}
              >
                Não há outras doses pendentes para o dia de hoje.
              </Text>
            </View>
          )}
        </View>

        {/* Mini-mapa 2x3 da caixa física destacando próximas gavetas */}
        <BoxCabinetMap
          drawersState={drawersMap}
          highlightDrawers={nextMoment ? nextMoment.drawers : []}
        />

        {/* Linha do tempo da rotina de hoje */}
        <Text
          style={[
            styles.timelineHeader,
            { color: colors.textPrimary, fontSize: scaleFont(26) },
          ]}
        >
          Rotina de Hoje
        </Text>

        {scheduledDoses.length === 0 ? (
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
              Nenhum medicamento programado para hoje.
            </Text>
          </View>
        ) : (
          scheduledDoses.map((dose) => (
            <DoseTimelineItem
              key={`${dose.medication.id}-${dose.time}`}
              dose={dose}
              onTakeDose={() => handleTakePress(dose)}
              onMissDose={() => handleMissPress(dose)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal de confirmação */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={
          confirmModal.type === 'duplicate'
            ? 'Atenção: Remédio já tomado!'
            : confirmModal.type === 'take'
            ? 'Confirmar que tomou?'
            : 'Registrar que não tomou?'
        }
        message={
          confirmModal.type === 'duplicate'
            ? `Você já tomou o ${confirmModal.dose?.medication.name} hoje por volta das ${confirmModal.duplicateTime || 'HH:MM'}. Deseja confirmar novamente?`
            : confirmModal.type === 'take'
            ? `Você tomou ${confirmModal.dose?.medication.name} (${confirmModal.dose?.medication.strength}) da Gaveta ${confirmModal.dose?.medication.drawer}?`
            : `Confirma que você não tomou a dose de ${confirmModal.dose?.medication.name} programada para as ${confirmModal.dose?.time}?`
        }
        confirmLabel={
          confirmModal.type === 'duplicate'
            ? 'Sim, tomei de novo'
            : confirmModal.type === 'take'
            ? 'Sim, já tomei'
            : 'Sim, não tomei'
        }
        cancelLabel="Não, cancelar"
        isDestructive={confirmModal.type === 'miss'}
        onConfirm={handleConfirmAction}
        onCancel={() =>
          setConfirmModal({ visible: false, type: 'take', dose: null })
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
  deviceBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD7CD',
    padding: 12,
    marginBottom: 12,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceStatusText: {
    fontSize: 16,
    color: '#0A1C10',
  },
  syncText: {
    fontSize: 14,
    color: '#4A6078',
    marginTop: 4,
    marginLeft: 20,
  },
  activeAlarmBanner: {
    backgroundColor: '#FFF3D6',
    borderWidth: 2,
    borderColor: '#8F5300',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  alarmBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8F5300',
  },
  alarmBannerSub: {
    fontSize: 17,
    color: '#5E3600',
    marginTop: 4,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0A1C10',
    marginBottom: 8,
  },
  nextHeroCard: {
    backgroundColor: '#0B5A25',
    borderRadius: 18,
    padding: 18,
    marginVertical: 8,
  },
  heroSubHeader: {
    color: '#D8F2E6',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTime: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  nextMedRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  nextMedName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  nextMedDetails: {
    color: '#E8F5E9',
    fontSize: 18,
    marginTop: 2,
  },
  nextMedDrawer: {
    color: '#FFD600',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  allDoneTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  allDoneSub: {
    color: '#D8F2E6',
    fontSize: 18,
    marginTop: 4,
  },
  timelineHeader: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A1C10',
    marginTop: 18,
    marginBottom: 8,
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
    textAlign: 'center',
  },
});
