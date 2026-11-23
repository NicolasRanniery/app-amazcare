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
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { useDeviceStore } from '../../src/store/useDeviceStore';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { generateDailyDoses, groupDosesByMoment } from '../../src/domain/schedule';
import { formatDateISO } from '../../src/domain/status';
import { DrawerId } from '../../src/domain/types';

export default function ModoDemonstracaoScreen() {
  const router = useRouter();
  const deviceStatus = useDeviceStore((s) => s.status);
  const openDrawer = useDeviceStore((s) => s.openDrawer);
  const closeDrawer = useDeviceStore((s) => s.closeDrawer);
  const startAlarm = useDeviceStore((s) => s.startAlarm);
  const stopAlarm = useDeviceStore((s) => s.stopAlarm);
  const toggleWifi = useDeviceStore((s) => s.toggleWifi);
  const lastEvent = useDeviceStore((s) => s.lastEvent);

  const medications = useMedicationStore((s) => s.medications);
  const resetDemoData = useMedicationStore((s) => s.resetDemoData);

  const getNow = useSettingsStore((s) => s.getNow);
  const advanceClock = useSettingsStore((s) => s.advanceClock);
  const resetClock = useSettingsStore((s) => s.resetClock);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [message, setMessage] = React.useState('');

  const now = getNow();
  const todayStr = formatDateISO(now);

  // Mapeamento das gavetas
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

  const handleSimulateNextAlarm = () => {
    // Simula alarme simultâneo para Gaveta 1 e Gaveta 4 (08:00) para mostrar polifarmácia!
    const morningMeds = medications.filter(
      (m) => !m.archivedAt && m.times.includes('08:00')
    );

    const drawers = morningMeds.map((m) => m.drawer);
    const medIds = morningMeds.map((m) => m.id);

    startAlarm({
      time: '08:00',
      date: todayStr,
      drawers: drawers.length > 0 ? drawers : [1, 4],
      medicationIds: medIds.length > 0 ? medIds : ['med-1', 'med-4'],
    });

    setMessage('Alarme simultâneo disparado! Gavetas 1 e 4 acesas.');
    router.push('/alerta');
  };

  const handleDrawerToggle = (drawer: DrawerId) => {
    const isOpen = deviceStatus.drawers[drawer]?.open;
    if (isOpen) {
      closeDrawer(drawer);
    } else {
      openDrawer(drawer);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings
        showBackButton
        backTitle="Ajustes"
        title="Modo Demonstração (Banca)"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: colors.primaryBg,
              borderColor: colors.primary,
              borderWidth: colors.borderWidthStrong,
            },
          ]}
        >
          <Text
            style={[
              styles.infoTitle,
              { color: colors.primary, fontSize: scaleFont(22) },
            ]}
          >
            Controles da Apresentação
          </Text>
          <Text
            style={[
              styles.infoText,
              { color: colors.textPrimary, fontSize: scaleFont(17) },
            ]}
          >
            Utilize os botões abaixo para simular todos os 7 requisitos e alertas da caixa ao vivo para a banca de avaliação.
          </Text>
        </View>

        {message ? (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: colors.secondaryBg,
                borderColor: colors.secondary,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: colors.secondary, fontSize: scaleFont(17) },
              ]}
            >
              ℹ {message}
            </Text>
          </View>
        ) : null}

        {/* Simulação de Horários */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            1. Simulação do Relógio e Alarmes
          </Text>
          <AccessibleButton
            title="▶ Disparar Alarme Simultâneo (08:00: Gavetas 1 e 4)"
            onPress={handleSimulateNextAlarm}
            variant="primary"
            size="large"
          />

          <View style={styles.timeButtonsRow}>
            <AccessibleButton
              title="Avançar +1 hora"
              onPress={() => {
                advanceClock(3600 * 1000);
                setMessage('Relógio avançado em 1 hora.');
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
            <AccessibleButton
              title="Avançar +1 dia"
              onPress={() => {
                advanceClock(86400 * 1000);
                setMessage('Relógio avançado em 1 dia.');
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>

          <AccessibleButton
            title="↺ Restaurar Relógio do Sistema"
            onPress={() => {
              resetClock();
              setMessage('Relógio restaurado para o horário atual.');
            }}
            variant="outline"
          />
        </View>

        {/* Simulação dos Sensores da Caixa */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            2. Sensores das Gavetas (Frente da Caixa)
          </Text>
          <Text
            style={[
              styles.sectionSub,
              { color: colors.textMuted, fontSize: scaleFont(16) },
            ]}
          >
            Toque nas gavetas para simular abertura ou fechamento:
          </Text>

          <BoxCabinetMap
            drawersState={drawersMap}
            onSelectDrawer={handleDrawerToggle}
          />

          <View style={styles.drawerControlsGrid}>
            {([1, 2, 3, 4, 5, 6] as DrawerId[]).map((d) => {
              const isOpen = deviceStatus.drawers[d]?.open;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => handleDrawerToggle(d)}
                  style={[
                    styles.drawerToggleBtn,
                    {
                      backgroundColor: colors.bgCanvas,
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
                      styles.drawerToggleText,
                      { color: colors.textPrimary, fontSize: scaleFont(15) },
                    ]}
                  >
                    G{d}: {isOpen ? 'Aberta' : 'Fechada'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Conexão e Buzzer */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            3. Hardware e Comunicação
          </Text>
          <View style={styles.twoBtnRow}>
            <AccessibleButton
              title={
                deviceStatus.online
                  ? 'Desconectar Wi-Fi'
                  : 'Reconectar Wi-Fi'
              }
              onPress={toggleWifi}
              variant={deviceStatus.online ? 'danger' : 'success'}
              style={{ flex: 1 }}
            />
            <AccessibleButton
              title={deviceStatus.buzzer ? 'Parar Buzzer' : 'Tocar Buzzer'}
              onPress={() => (deviceStatus.buzzer ? stopAlarm() : startAlarm({ time: '12:00', date: todayStr, drawers: [2], medicationIds: ['med-2'] }))}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Reset Geral */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionHeader,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            4. Reset de Dados da Apresentação
          </Text>
          <AccessibleButton
            title="↺ Restaurar Dados de Exemplo da Banca"
            onPress={() => {
              resetDemoData();
              resetClock();
              stopAlarm();
              setMessage('Dados de exemplo restaurados com sucesso.');
            }}
            variant="danger"
            size="large"
          />
        </View>
      </ScrollView>
    </View>
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
  infoBanner: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  infoTitle: {
    fontWeight: '800',
  },
  infoText: {
    marginTop: 4,
    lineHeight: 24,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionSub: {
    marginBottom: 8,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  twoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  drawerControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  drawerToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: '30%',
    alignItems: 'center',
  },
  drawerToggleBtnOpen: {},
  drawerToggleText: {
    fontWeight: '700',
  },
});
