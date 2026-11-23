import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HeaderWithSettings } from '../../src/components/HeaderWithSettings';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { NumberStepper } from '../../src/components/NumberStepper';
import { TimePresetPicker } from '../../src/components/TimePresetPicker';
import { BoxCabinetMap } from '../../src/components/BoxCabinetMap';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { DrawerId, DoseUnit, Medication } from '../../src/domain/types';

export default function EditarRemedioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const medications = useMedicationStore((s) => s.medications);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const existingMed = medications.find((m) => m.id === id);

  const [name, setName] = React.useState(existingMed?.name || '');
  const [strength, setStrength] = React.useState(existingMed?.strength || '');
  const [doseAmount, setDoseAmount] = React.useState(
    existingMed?.dose.amount || 1
  );
  const [doseUnit, setDoseUnit] = React.useState<DoseUnit>(
    existingMed?.dose.unit || 'comprimido'
  );
  const [times, setTimes] = React.useState<string[]>(
    existingMed?.times || ['08:00']
  );
  const [drawer, setDrawer] = React.useState<DrawerId>(
    existingMed?.drawer || 1
  );
  const [notes, setNotes] = React.useState(existingMed?.notes || '');
  const [errorMsg, setErrorMsg] = React.useState('');

  if (!existingMed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        <HeaderWithSettings showBackButton title="Medicamento não encontrado" />
        <View style={styles.notFoundCard}>
          <Text
            style={[
              styles.notFoundText,
              { color: colors.textPrimary, fontSize: scaleFont(20) },
            ]}
          >
            Este medicamento não foi localizado no sistema.
          </Text>
          <AccessibleButton
            title="Voltar para Remédios"
            onPress={() => router.replace('/(tabs)/remedios')}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  // Gavetas ocupadas por outros remédios (exceto o próprio que está sendo editado)
  const occupiedDrawers = medications
    .filter((m) => !m.archivedAt && m.id !== id)
    .map((m) => m.drawer);

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

  for (const m of medications) {
    if (!m.archivedAt && drawersMap[m.drawer]) {
      drawersMap[m.drawer].medicationName = m.name;
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !strength.trim()) {
      setErrorMsg('Preencha o nome e a dosagem do remédio.');
      return;
    }
    if (times.length === 0) {
      setErrorMsg('Selecione pelo menos um horário.');
      return;
    }

    const updated: Medication = {
      ...existingMed,
      name: name.trim(),
      strength: strength.trim(),
      dose: {
        amount: doseAmount,
        unit: doseUnit,
      },
      times: times.sort(),
      drawer,
      notes: notes.trim() || undefined,
    };

    await updateMedication(updated);
    router.replace('/(tabs)/remedios');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings
        showBackButton
        backTitle="Remédios"
        title={`Editar ${existingMed.name}`}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.urgentBg,
                borderColor: colors.urgent,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.errorText,
                { color: colors.urgent, fontSize: scaleFont(17) },
              ]}
            >
              ⚠ {errorMsg}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: colors.textPrimary, fontSize: scaleFont(18) },
            ]}
          >
            Nome do medicamento:
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
                color: colors.textPrimary,
                fontSize: scaleFont(19),
              },
            ]}
          />

          <Text
            style={[
              styles.label,
              { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 14 },
            ]}
          >
            Dosagem:
          </Text>
          <TextInput
            value={strength}
            onChangeText={setStrength}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
                color: colors.textPrimary,
                fontSize: scaleFont(19),
              },
            ]}
          />

          <NumberStepper
            label="Quantidade por dose:"
            value={doseAmount}
            onChange={setDoseAmount}
            min={1}
            max={10}
            unitLabel={doseUnit}
          />

          <TimePresetPicker times={times} onChange={setTimes} />

          <Text
            style={[
              styles.label,
              { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 14 },
            ]}
          >
            Gaveta na Caixa AMAZCARE:
          </Text>
          <BoxCabinetMap
            drawersState={drawersMap}
            selectedDrawer={drawer}
            disabledDrawers={occupiedDrawers}
            onSelectDrawer={(d) => setDrawer(d)}
          />

          <Text
            style={[
              styles.label,
              { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 14 },
            ]}
          >
            Instruções e observações:
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[
              styles.textInput,
              {
                minHeight: 70,
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
                color: colors.textPrimary,
                fontSize: scaleFont(19),
              },
            ]}
            multiline
          />
        </View>

        <AccessibleButton
          title="✔ Salvar alterações"
          onPress={handleSave}
          variant="success"
          size="large"
        />
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
  notFoundCard: {
    padding: 24,
    alignItems: 'center',
  },
  notFoundText: {
    marginBottom: 16,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
});
