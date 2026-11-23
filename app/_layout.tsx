import React from 'react';
import { Stack, useRouter } from 'expo-router';
export { ErrorBoundary } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDeviceStore } from '../src/store/useDeviceStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useMedicationStore } from '../src/store/useMedicationStore';
import { useAppTheme } from '../src/theme/useAppTheme';
import { notificationService } from '../src/services/notificationService';
import { speechService } from '../src/services/speechService';
import { hapticService } from '../src/services/hapticService';
import { generateDailyDoses, groupDosesByMoment } from '../src/domain/schedule';
import { calculateDoseStatus, formatDateISO } from '../src/domain/status';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  const router = useRouter();
  const initializeGateway = useDeviceStore((s) => s.initializeGateway);
  const activeAlarm = useDeviceStore((s) => s.activeAlarm);
  const startAlarm = useDeviceStore((s) => s.startAlarm);
  const getNow = useSettingsStore((s) => s.getNow);
  const toleranceMinutes = useSettingsStore((s) => s.toleranceMinutes);
  const voiceInstructions = useSettingsStore((s) => s.voiceInstructions);
  const medications = useMedicationStore((s) => s.medications);
  const events = useMedicationStore((s) => s.events);

  // Inicializa comunicação com o gateway (Mock ou HTTP)
  React.useEffect(() => {
    const cleanup = initializeGateway();
    notificationService.requestPermissions();
    return () => cleanup();
  }, [initializeGateway]);

  // Loop de monitoramento de horários derivado do relógio
  React.useEffect(() => {
    const checkSchedule = () => {
      const now = getNow();
      const todayStr = formatDateISO(now);
      const daily = generateDailyDoses(medications, todayStr);

      const scheduledDoses = daily.map((d) => {
        const { status } = calculateDoseStatus(
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
          }
        );
        return {
          ...d,
          status,
        };
      });

      const moments = groupDosesByMoment(scheduledDoses);

      // Procura momento com dose atrasada ou na hora que ainda não foi disparado
      if (!activeAlarm) {
        for (const moment of moments) {
          const hasDueDose = moment.doses.some(
            (d) => d.status === 'atrasada' || d.status === 'andamento'
          );

          if (hasDueDose) {
            const medNames = moment.doses.map((d) => d.medication.name).join(', ');
            startAlarm({
              time: moment.time,
              date: moment.date,
              drawers: moment.drawers,
              medicationIds: moment.doses.map((d) => d.medication.id),
            });

            // Dispara alertas sensoriais
            hapticService.alarm();
            if (voiceInstructions) {
              speechService.speak(
                `Atenção. Hora do remédio: ${medNames}. Por favor, abra a gaveta indicada na caixa.`
              );
            }

            // Abre a tela de alarme
            router.push('/alerta');
            break;
          }
        }
      }
    };

    const interval = setInterval(checkSchedule, 1000);
    return () => clearInterval(interval);
  }, [
    getNow,
    medications,
    events,
    activeAlarm,
    toleranceMinutes,
    voiceInstructions,
    startAlarm,
    router,
  ]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F4F7F4',
        }}
      >
        <ActivityIndicator size="large" color="#0B5A25" />
        <Text style={{ marginTop: 12, fontSize: 18, color: '#0A1C10' }}>
          Carregando AMAZCARE...
        </Text>
      </View>
    );
  }

  const { colors } = useAppTheme();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgCanvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="alerta"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen name="ajustes" options={{ headerShown: false }} />
        <Stack.Screen
          name="ajustes/demonstracao"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="remedio/novo" options={{ headerShown: false }} />
        <Stack.Screen name="remedio/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
