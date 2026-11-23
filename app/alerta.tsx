import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BoxCabinetMap } from '../src/components/BoxCabinetMap';
import { AccessibleButton } from '../src/components/AccessibleButton';
import { ConfirmationModal } from '../src/components/ConfirmationModal';
import { useDeviceStore } from '../src/store/useDeviceStore';
import { useMedicationStore } from '../src/store/useMedicationStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useAppTheme } from '../src/theme/useAppTheme';
import { speechService } from '../src/services/speechService';
import { hapticService } from '../src/services/hapticService';
import { checkDuplicateDose, formatDateISO } from '../src/domain/status';
import { DrawerId, Medication } from '../src/domain/types';

export default function AlertaScreen() {
  const router = useRouter();
  const activeAlarm = useDeviceStore((s) => s.activeAlarm);
  const stopAlarm = useDeviceStore((s) => s.stopAlarm);
  const deviceStatus = useDeviceStore((s) => s.status);
  const lastEvent = useDeviceStore((s) => s.lastEvent);
  const openDrawer = useDeviceStore((s) => s.openDrawer);
  const closeDrawer = useDeviceStore((s) => s.closeDrawer);

  const medications = useMedicationStore((s) => s.medications);
  const events = useMedicationStore((s) => s.events);
  const recordDoseTaken = useMedicationStore((s) => s.recordDoseTaken);
  const recordDoseMissed = useMedicationStore((s) => s.recordDoseMissed);

  const getNow = useSettingsStore((s) => s.getNow);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [confirmModal, setConfirmModal] = React.useState<{
    visible: boolean;
    type: 'take' | 'skip' | 'duplicate';
    duplicateInfo?: string;
  }>({
    visible: false,
    type: 'take',
  });

  // Lista de medicamentos ativos neste alarme
  const activeMeds: Medication[] = React.useMemo(() => {
    if (!activeAlarm) return [];
    return medications.filter((m) =>
      activeAlarm.medicationIds.includes(m.id)
    );
  }, [activeAlarm, medications]);

  // Se nenhum alarme estiver ativo, volta para a tela inicial
  React.useEffect(() => {
    if (!activeAlarm) {
      router.replace('/(tabs)/hoje');
    }
  }, [activeAlarm, router]);

  // Lê em voz alta automaticamente na abertura
  React.useEffect(() => {
    if (activeMeds.length > 0) {
      const speechText = activeMeds
        .map(
          (m) =>
            `${m.name}, ${m.strength}, ${m.dose.amount} ${m.dose.unit}. Abra a gaveta ${m.drawer}.`
        )
        .join(' ');
      speechService.speak(
        `Hora do remédio! ${speechText}`
      );
    }
  }, [activeMeds]);

  // Mapeamento das gavetas para o BoxCabinetMap
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

  const activeDrawers = activeAlarm?.drawers || [];
  const anyActiveOpen = activeDrawers.some((d) => deviceStatus.drawers[d]?.open);
  const anyActiveBlinking = activeDrawers.some(
    (d) => deviceStatus.drawers[d]?.led === 'blink'
  );

  // Determina o passo atual da máquina de estados física
  let currentStep = 1; // 1: Alerta ativo
  let stepMessage = 'Abra a gaveta indicada na caixa.';

  if (anyActiveOpen) {
    currentStep = 2; // 2: Gaveta aberta
    stepMessage = 'Gaveta correta aberta! Pegue o remédio e feche a gaveta.';
  } else if (anyActiveBlinking) {
    currentStep = 3; // 3: Gaveta fechada
    stepMessage = 'Gaveta fechada. Confirme que tomou o remédio abaixo.';
  }

  // Verifica se o último evento foi abertura de gaveta errada
  const isWrongDrawerOpen =
    lastEvent?.type === 'WRONG_DRAWER' &&
    deviceStatus.drawers[lastEvent.drawer]?.open;

  const handleSpeech = () => {
    const text = activeMeds
      .map(
        (m) =>
          `São ${activeAlarm?.time}. Tome o ${m.name}, ${m.strength}, ${m.dose.amount} ${m.dose.unit}. Abra a gaveta ${m.drawer}.`
      )
      .join(' ');
    speechService.speak(text);
  };

  const handleTakePress = () => {
    // Checa duplicação para qualquer remédio ativo
    const todayStr = formatDateISO(getNow());
    for (const med of activeMeds) {
      const scheduledFor = `${todayStr}T${activeAlarm?.time}:00`;
      const dup = checkDuplicateDose(med.id, scheduledFor, events);
      if (dup.isDuplicate) {
        setConfirmModal({
          visible: true,
          type: 'duplicate',
          duplicateInfo: `${med.name} às ${dup.lastTakenAt?.slice(11, 16)}`,
        });
        return;
      }
    }

    setConfirmModal({ visible: true, type: 'take' });
  };

  const handleConfirmAction = async () => {
    if (!activeAlarm) return;
    const todayStr = formatDateISO(getNow());

    if (confirmModal.type === 'take' || confirmModal.type === 'duplicate') {
      for (const med of activeMeds) {
        const scheduledFor = `${todayStr}T${activeAlarm.time}:00`;
        await recordDoseTaken(med.id, scheduledFor, 'caixa');
      }
      hapticService.success();
    } else if (confirmModal.type === 'skip') {
      for (const med of activeMeds) {
        const scheduledFor = `${todayStr}T${activeAlarm.time}:00`;
        await recordDoseMissed(med.id, scheduledFor, 'app');
      }
    }

    await stopAlarm();
    setConfirmModal({ visible: false, type: 'take' });
    router.replace('/(tabs)/hoje');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isHighContrast ? '#FFFFFF' : '#FDE8E7' },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho de urgência */}
        <View
          style={[
            styles.alertHeader,
            {
              backgroundColor: colors.urgent,
              borderColor: isHighContrast ? '#000000' : 'transparent',
              borderWidth: isHighContrast ? 3 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.alertHeaderTag,
              { fontSize: scaleFont(18) },
            ]}
          >
            ⏰ ALERTA DE MEDICAMENTO
          </Text>
          <Text
            style={[
              styles.alertTime,
              { fontSize: scaleFont(32) },
            ]}
          >
            Horário: {activeAlarm?.time}
          </Text>
        </View>

        {/* Alerta de gaveta incorreta aberta */}
        {isWrongDrawerOpen && (
          <View
            style={[
              styles.wrongDrawerBanner,
              {
                backgroundColor: colors.urgentBg,
                borderColor: colors.urgent,
                borderWidth: colors.borderWidthStrong,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={[
                styles.wrongDrawerTitle,
                { color: colors.urgent, fontSize: scaleFont(20) },
              ]}
            >
              ⚠ Atenção: Gaveta {lastEvent.drawer} aberta por engano!
            </Text>
            <Text
              style={[
                styles.wrongDrawerSub,
                { color: colors.textPrimary, fontSize: scaleFont(17) },
              ]}
            >
              Por favor, feche a gaveta {lastEvent.drawer} e abra a{' '}
              <Text style={{ fontWeight: '800' }}>
                Gaveta {activeDrawers.join(', ')}
              </Text>
              .
            </Text>
          </View>
        )}

        {/* Informações da posologia para cada remédio deste horário */}
        {activeMeds.map((med) => (
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
            <Text
              style={[
                styles.medName,
                { color: colors.textPrimary, fontSize: scaleFont(26) },
              ]}
            >
              {med.name}
            </Text>
            <Text
              style={[
                styles.strengthText,
                { color: colors.textMuted, fontSize: scaleFont(22) },
              ]}
            >
              {med.strength} · {med.dose.amount} {med.dose.unit}(s)
            </Text>
            <View
              style={[
                styles.drawerHighlightBadge,
                {
                  backgroundColor: colors.accentGoldBg,
                  borderColor: colors.accentGold,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <Text
                style={[
                  styles.drawerHighlightText,
                  { color: colors.accentGold, fontSize: scaleFont(22) },
                ]}
              >
                👉 Abra a Gaveta {med.drawer}
              </Text>
            </View>
            {med.notes && (
              <Text
                style={[
                  styles.notesText,
                  { color: colors.textMuted, fontSize: scaleFont(17) },
                ]}
              >
                Nota: {med.notes}
              </Text>
            )}
          </View>
        ))}

        {/* Mini-mapa 2x3 da caixa física com as gavetas acesas */}
        <BoxCabinetMap
          drawersState={drawersMap}
          highlightDrawers={activeDrawers}
        />

        {/* Passo a passo da caixa */}
        <View
          style={[
            styles.stepContainer,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.stepTitle,
              { color: colors.textPrimary, fontSize: scaleFont(18) },
            ]}
          >
            Estado da Caixa: Passo {currentStep} de 4
          </Text>
          <View style={styles.stepBar}>
            <View
              style={[
                styles.stepItem,
                { backgroundColor: colors.borderSubtle },
                currentStep >= 1 && { backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.stepItem,
                { backgroundColor: colors.borderSubtle },
                currentStep >= 2 && { backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.stepItem,
                { backgroundColor: colors.borderSubtle },
                currentStep >= 3 && { backgroundColor: colors.primary },
              ]}
            />
            <View
              style={[
                styles.stepItem,
                { backgroundColor: colors.borderSubtle },
                currentStep >= 4 && { backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text
            style={[
              styles.stepMessage,
              { color: colors.textPrimary, fontSize: scaleFont(19) },
            ]}
          >
            {stepMessage}
          </Text>
        </View>

        {/* Botões de simulação da caixa para a demonstração/banca */}
        <View
          style={[
            styles.simCard,
            {
              backgroundColor: colors.bgCanvas,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.simTitle,
              { color: colors.textMuted, fontSize: scaleFont(16) },
            ]}
          >
            Simulação manual dos sensores:
          </Text>
          <View style={styles.simRow}>
            {activeDrawers.map((d) => {
              const isOpen = deviceStatus.drawers[d]?.open;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => (isOpen ? closeDrawer(d) : openDrawer(d))}
                  style={[
                    styles.simBtn,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderStrong,
                      borderWidth: colors.borderWidth,
                    },
                    isOpen && {
                      backgroundColor: colors.accentGoldBg,
                      borderColor: colors.accentGold,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.simBtnText,
                      { color: colors.textPrimary, fontSize: scaleFont(16) },
                    ]}
                  >
                    {isOpen ? `Fechar Gaveta ${d}` : `Abrir Gaveta ${d}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botão de voz acessível */}
        <AccessibleButton
          title="🔊 Ouvir orientação em voz alta"
          onPress={handleSpeech}
          variant="secondary"
          size="large"
          accessibilityLabel="Ouvir instrução da medicação em voz alta"
        />

        {/* Ações principais */}
        <AccessibleButton
          title="✔ Já tomei os remédios"
          onPress={handleTakePress}
          variant="success"
          size="large"
          accessibilityLabel="Confirmar que tomou a medicação"
        />

        <AccessibleButton
          title="Não vou tomar agora"
          onPress={() => setConfirmModal({ visible: true, type: 'skip' })}
          variant="danger"
          size="normal"
          accessibilityLabel="Marcar que não vai tomar esta dose agora"
        />
      </ScrollView>

      {/* Modal de confirmação */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={
          confirmModal.type === 'duplicate'
            ? 'Atenção: Remédio já tomado!'
            : confirmModal.type === 'take'
            ? 'Confirmar ingestão?'
            : 'Não tomar agora?'
        }
        message={
          confirmModal.type === 'duplicate'
            ? `Você já registrou a tomada deste medicamento hoje (${confirmModal.duplicateInfo}). Tem certeza que deseja registrar novamente?`
            : confirmModal.type === 'take'
            ? 'Você confirma que pegou e tomou todos os comprimidos das gavetas indicadas?'
            : 'Essa dose será registrada no histórico como não tomada (esquecida). Confirma?'
        }
        confirmLabel={
          confirmModal.type === 'duplicate'
            ? 'Sim, tomar novamente'
            : confirmModal.type === 'take'
            ? 'Sim, já tomei'
            : 'Sim, registrar esquecimento'
        }
        cancelLabel="Voltar"
        isDestructive={confirmModal.type === 'skip'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ visible: false, type: 'take' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  alertHeader: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  alertHeaderTag: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertTime: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 4,
  },
  wrongDrawerBanner: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  wrongDrawerTitle: {
    fontWeight: '800',
  },
  wrongDrawerSub: {
    marginTop: 4,
  },
  medCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  medName: {
    fontWeight: '800',
  },
  strengthText: {
    fontWeight: '700',
    marginVertical: 4,
  },
  drawerHighlightBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  drawerHighlightText: {
    fontWeight: '800',
  },
  notesText: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  stepContainer: {
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  stepItem: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  stepMessage: {
    fontWeight: '700',
  },
  simCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  simTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  simRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  simBtnText: {
    fontWeight: '700',
  },
});
