import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderWithSettings } from '../src/components/HeaderWithSettings';
import { AccessibleButton } from '../src/components/AccessibleButton';
import { NumberStepper } from '../src/components/NumberStepper';
import { useSettingsStore, TextScalePreference } from '../src/store/useSettingsStore';
import { useDeviceStore } from '../src/store/useDeviceStore';
import { useAppTheme } from '../src/theme/useAppTheme';

export default function AjustesScreen() {
  const router = useRouter();
  const textScale = useSettingsStore((s) => s.textScale);
  const setTextScale = useSettingsStore((s) => s.setTextScale);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);
  const voiceInstructions = useSettingsStore((s) => s.voiceInstructions);
  const setVoiceInstructions = useSettingsStore((s) => s.setVoiceInstructions);
  const toleranceMinutes = useSettingsStore((s) => s.toleranceMinutes);
  const setToleranceMinutes = useSettingsStore((s) => s.setToleranceMinutes);

  const deviceStatus = useDeviceStore((s) => s.status);
  const toggleWifi = useDeviceStore((s) => s.toggleWifi);

  const { colors, scaleFont, isHighContrast } = useAppTheme();
  const deviceMode = process.env.EXPO_PUBLIC_DEVICE_MODE || 'mock';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings
        showBackButton
        backTitle="Voltar"
        title="Ajustes e Acessibilidade"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status da Caixa AMAZCARE */}
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
              styles.sectionTitle,
              { color: colors.textPrimary, fontSize: scaleFont(22) },
            ]}
          >
            Conexão com a Caixa
          </Text>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusLabel,
                { color: colors.textMuted, fontSize: scaleFont(17) },
              ]}
            >
              Comunicação Wi-Fi:
            </Text>
            <View
              style={[
                styles.chipBadge,
                {
                  backgroundColor: deviceStatus.online
                    ? colors.primaryBg
                    : colors.urgentBg,
                  borderColor: deviceStatus.online
                    ? colors.primary
                    : colors.urgent,
                  borderWidth: isHighContrast ? 2 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: deviceStatus.online
                      ? colors.primary
                      : colors.urgent,
                    fontSize: scaleFont(15),
                  },
                ]}
              >
                {deviceStatus.online ? '✔ Conectada' : '✖ Desconectada'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusLabel,
                { color: colors.textMuted, fontSize: scaleFont(17) },
              ]}
            >
              Modo do Dispositivo:
            </Text>
            <Text
              style={[
                styles.statusValue,
                { color: colors.textPrimary, fontSize: scaleFont(17) },
              ]}
            >
              {deviceMode === 'http' ? 'ESP32 Real (HTTP)' : 'Simulador (Mock)'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusLabel,
                { color: colors.textMuted, fontSize: scaleFont(17) },
              ]}
            >
              Última Sincronização:
            </Text>
            <Text
              style={[
                styles.statusValue,
                { color: colors.textPrimary, fontSize: scaleFont(17) },
              ]}
            >
              {deviceStatus.lastSyncAt
                ? new Date(deviceStatus.lastSyncAt).toLocaleTimeString('pt-BR')
                : 'Pendente'}
            </Text>
          </View>

          <AccessibleButton
            title={
              deviceStatus.online
                ? 'Simular queda da conexão Wi-Fi'
                : 'Restaurar conexão Wi-Fi'
            }
            onPress={toggleWifi}
            variant="outline"
          />
        </View>

        {/* Tamanho da Fonte */}
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
              styles.sectionTitle,
              { color: colors.textPrimary, fontSize: scaleFont(22) },
            ]}
          >
            Tamanho do Texto
          </Text>
          <Text
            style={[
              styles.sectionDesc,
              { color: colors.textMuted, fontSize: scaleFont(16) },
            ]}
          >
            Ajuste para facilitar a leitura caso prefira letras maiores.
          </Text>

          <View style={styles.scaleRow}>
            {(
              [
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Grande' },
                { id: 'extra', label: 'Extra Grande' },
              ] as Array<{ id: TextScalePreference; label: string }>
            ).map((item) => {
              const isSelected = textScale === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setTextScale(item.id)}
                  style={[
                    styles.scaleChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.bgSurface,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.borderSubtle,
                      borderWidth: isSelected
                        ? colors.borderWidthStrong
                        : colors.borderWidth,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Tamanho de texto ${item.label}`}
                >
                  <Text
                    style={[
                      styles.scaleText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontSize: scaleFont(15),
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Alto Contraste */}
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
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={[
                  styles.switchTitle,
                  { color: colors.textPrimary, fontSize: scaleFont(20) },
                ]}
              >
                Modo Alto Contraste
              </Text>
              <Text
                style={[
                  styles.switchDesc,
                  { color: colors.textMuted, fontSize: scaleFont(16) },
                ]}
              >
                Aumenta a espessura de bordas e intensifica o contraste das cores.
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{
                false: colors.borderSubtle,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Leitura por Voz (TTS) */}
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
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={[
                  styles.switchTitle,
                  { color: colors.textPrimary, fontSize: scaleFont(20) },
                ]}
              >
                Instruções por Voz
              </Text>
              <Text
                style={[
                  styles.switchDesc,
                  { color: colors.textMuted, fontSize: scaleFont(16) },
                ]}
              >
                Lê automaticamente em voz alta os nomes dos remédios e qual gaveta abrir na hora do alarme.
              </Text>
            </View>
            <Switch
              value={voiceInstructions}
              onValueChange={setVoiceInstructions}
              trackColor={{
                false: colors.borderSubtle,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Tolerância para Esquecimento */}
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
              styles.sectionTitle,
              { color: colors.textPrimary, fontSize: scaleFont(22) },
            ]}
          >
            Tolerância para Esquecimento
          </Text>
          <Text
            style={[
              styles.sectionDesc,
              { color: colors.textMuted, fontSize: scaleFont(16) },
            ]}
          >
            Tempo após o horário para que uma dose não tomada seja considerada automaticamente como esquecida.
          </Text>

          <NumberStepper
            label="Janela de tolerância:"
            value={toleranceMinutes}
            onChange={setToleranceMinutes}
            min={15}
            max={180}
            step={15}
            unitLabel="minutos"
          />
        </View>

        {/* Botão para o Modo de Demonstração (Banca) */}
        <View
          style={[
            styles.demoCard,
            {
              backgroundColor: colors.primaryBg,
              borderColor: colors.primary,
              borderWidth: colors.borderWidthStrong,
            },
          ]}
        >
          <Text
            style={[
              styles.demoTitle,
              { color: colors.primary, fontSize: scaleFont(22) },
            ]}
          >
            Painel de Apresentação Comercial
          </Text>
          <Text
            style={[
              styles.demoDesc,
              { color: colors.textPrimary, fontSize: scaleFont(16) },
            ]}
          >
            Ferramentas para simular horários, acelerar o relógio e controlar os sensores e LEDs da caixa durante a avaliação da banca.
          </Text>

          <AccessibleButton
            title="📟 Abrir Modo Demonstração"
            onPress={() => router.push('/ajustes/demonstracao')}
            variant="primary"
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
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDesc: {
    marginBottom: 12,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  statusLabel: {
    fontWeight: '600',
  },
  statusValue: {
    fontWeight: '700',
  },
  chipBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    fontWeight: '700',
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleChip: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scaleText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontWeight: '700',
  },
  switchDesc: {
    marginTop: 2,
    lineHeight: 22,
  },
  demoCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  demoTitle: {
    fontWeight: '800',
  },
  demoDesc: {
    marginVertical: 8,
    lineHeight: 22,
  },
});
