import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeaderWithSettings } from '../../src/components/HeaderWithSettings';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { NumberStepper } from '../../src/components/NumberStepper';
import { TimePresetPicker } from '../../src/components/TimePresetPicker';
import { BoxCabinetMap } from '../../src/components/BoxCabinetMap';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { formatDateISO } from '../../src/domain/status';
import { DrawerId, DoseUnit, Medication } from '../../src/domain/types';

export default function NovoRemedioScreen() {
  const router = useRouter();
  const medications = useMedicationStore((s) => s.medications);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const getNow = useSettingsStore((s) => s.getNow);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [step, setStep] = React.useState(1);

  // Campos do formulário
  const [name, setName] = React.useState('');
  const [strength, setStrength] = React.useState('');
  const [doseAmount, setDoseAmount] = React.useState(1);
  const [doseUnit, setDoseUnit] = React.useState<DoseUnit>('comprimido');
  const [times, setTimes] = React.useState<string[]>(['08:00']);
  const [startDate, setStartDate] = React.useState(formatDateISO(getNow()));
  const [hasEndDate, setHasEndDate] = React.useState(false);
  const [endDate, setEndDate] = React.useState('');
  const [drawer, setDrawer] = React.useState<DrawerId | null>(null);
  const [initialStock, setInitialStock] = React.useState(30);
  const [minAlert, setMinAlert] = React.useState(5);
  const [notes, setNotes] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Gavetas ocupadas por outros remédios ativos
  const occupiedDrawers = medications
    .filter((m) => !m.archivedAt)
    .map((m) => m.drawer);

  // Mapeamento para visualização no BoxCabinetMap
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

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg('Por favor, informe o nome do remédio.');
        return false;
      }
      if (!strength.trim()) {
        setErrorMsg('Informe a dosagem (ex: 500 mg, 20 gotas).');
        return false;
      }
    } else if (currentStep === 2) {
      if (doseAmount <= 0) {
        setErrorMsg('A quantidade deve ser de no mínimo 1.');
        return false;
      }
    } else if (currentStep === 3) {
      if (times.length === 0) {
        setErrorMsg('Selecione pelo menos um horário de tomada.');
        return false;
      }
    } else if (currentStep === 5) {
      if (!drawer) {
        setErrorMsg('Selecione uma das gavetas disponíveis na caixa.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(6, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleFinish = async () => {
    if (!drawer) return;

    await addMedication({
      name: name.trim(),
      strength: strength.trim(),
      dose: {
        amount: doseAmount,
        unit: doseUnit,
      },
      times: times.sort(),
      startDate,
      endDate: hasEndDate && endDate.trim() ? endDate.trim() : null,
      drawer,
      notes: notes.trim() || undefined,
      stock: {
        estimated: initialStock,
        minAlert,
        updatedAt: new Date().toISOString(),
      },
    });

    router.replace('/(tabs)/remedios');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings
        showBackButton
        backTitle="Voltar"
        onBack={handleBack}
        title="Cadastrar Remédio"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Indicador de progresso */}
        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.stepTitle,
              { color: colors.textPrimary, fontSize: scaleFont(18) },
            ]}
          >
            Passo {step} de 6
          </Text>
          <View style={styles.progressBar}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  { backgroundColor: colors.borderSubtle },
                  s <= step && { backgroundColor: colors.primary },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Mensagem de validação se houver */}
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
            accessibilityRole="alert"
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

        {/* Passo 1: Nome e Dosagem */}
        {step === 1 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Qual é o nome e a dosagem do remédio?
            </Text>

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textPrimary, fontSize: scaleFont(18) },
              ]}
            >
              Nome do medicamento:
            </Text>
            <TextInput
              placeholder="Ex.: Paracetamol, Losartana"
              placeholderTextColor={colors.textMuted}
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
              autoFocus
            />

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 16 },
              ]}
            >
              Dosagem prescrita:
            </Text>
            <TextInput
              placeholder="Ex.: 500 mg, 50 mg, 10 ml"
              placeholderTextColor={colors.textMuted}
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
          </View>
        )}

        {/* Passo 2: Quantidade por dose */}
        {step === 2 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Quantas unidades o idoso deve tomar por vez?
            </Text>

            <NumberStepper
              label="Quantidade por dose:"
              value={doseAmount}
              onChange={setDoseAmount}
              min={1}
              max={10}
              unitLabel={doseUnit}
            />

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 16 },
              ]}
            >
              Tipo de unidade:
            </Text>
            <View style={styles.unitRow}>
              {(
                ['comprimido', 'cápsula', 'gota', 'ml', 'outro'] as DoseUnit[]
              ).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setDoseUnit(u)}
                  style={[
                    styles.unitChip,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.borderSubtle,
                      borderWidth: colors.borderWidth,
                    },
                    doseUnit === u && {
                      backgroundColor: colors.primaryBg,
                      borderColor: colors.primary,
                      borderWidth: colors.borderWidthStrong,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      { color: colors.textPrimary, fontSize: scaleFont(16) },
                      doseUnit === u && { color: colors.primary },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Passo 3: Horários do dia */}
        {step === 3 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Em quais horários do dia este remédio deve ser tomado?
            </Text>
            <TimePresetPicker times={times} onChange={setTimes} />
          </View>
        )}

        {/* Passo 4: Início e término opcional */}
        {step === 4 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Duração do tratamento
            </Text>

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textPrimary, fontSize: scaleFont(18) },
              ]}
            >
              Data de início (AAAA-MM-DD):
            </Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
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

            <TouchableOpacity
              onPress={() => setHasEndDate(!hasEndDate)}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasEndDate }}
            >
              <View
                style={[
                  styles.checkboxBox,
                  {
                    borderColor: isHighContrast ? '#000000' : colors.borderStrong,
                    borderWidth: colors.borderWidth,
                    backgroundColor: colors.bgSurface,
                  },
                  hasEndDate && { backgroundColor: colors.primary },
                ]}
              >
                {hasEndDate && <Text style={styles.checkMark}>✔</Text>}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: colors.textPrimary, fontSize: scaleFont(17) },
                ]}
              >
                Este tratamento tem data final de término (não é contínuo)
              </Text>
            </TouchableOpacity>

            {hasEndDate && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.textPrimary, fontSize: scaleFont(18) },
                  ]}
                >
                  Data de término (AAAA-MM-DD):
                </Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="Ex.: 2026-12-31"
                  placeholderTextColor={colors.textMuted}
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
              </View>
            )}
          </View>
        )}

        {/* Passo 5: Escolha visual da gaveta no mapa 2x3 */}
        {step === 5 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Em qual gaveta da caixa física este remédio será colocado?
            </Text>
            <Text
              style={[
                styles.cardHelp,
                { color: colors.textMuted, fontSize: scaleFont(17) },
              ]}
            >
              Toque diretamente em uma das gavetas livres abaixo:
            </Text>

            <BoxCabinetMap
              drawersState={drawersMap}
              selectedDrawer={drawer}
              disabledDrawers={occupiedDrawers}
              onSelectDrawer={(d) => setDrawer(d)}
            />

            {drawer ? (
              <View
                style={[
                  styles.selectedDrawerBox,
                  {
                    backgroundColor: colors.primaryBg,
                    borderColor: colors.primary,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectedDrawerText,
                    { color: colors.primary, fontSize: scaleFont(19) },
                  ]}
                >
                  Gaveta selecionada: <Text style={{ fontWeight: '800' }}>Gaveta {drawer}</Text>
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Passo 6: Estoque inicial e Revisão */}
        {step === 6 && (
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Text
              style={[
                styles.cardQuestion,
                { color: colors.textPrimary, fontSize: scaleFont(22) },
              ]}
            >
              Estoque inicial e observações finais
            </Text>

            <NumberStepper
              label="Quantos comprimidos estão sendo colocados na gaveta agora?"
              value={initialStock}
              onChange={setInitialStock}
              min={1}
              max={200}
              step={5}
              unitLabel="unidades"
            />

            <NumberStepper
              label="Avisar quando restar menos de:"
              value={minAlert}
              onChange={setMinAlert}
              min={1}
              max={30}
              unitLabel="unidades"
            />

            <Text
              style={[
                styles.inputLabel,
                { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 12 },
              ]}
            >
              Instruções extras (opcional):
            </Text>
            <TextInput
              placeholder="Ex.: Tomar após o almoço, não deitar após tomar"
              placeholderTextColor={colors.textMuted}
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

            {/* Resumo de revisão */}
            <View
              style={[
                styles.reviewSummary,
                {
                  backgroundColor: colors.bgCanvas,
                  borderColor: colors.borderSubtle,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <Text
                style={[
                  styles.reviewTitle,
                  { color: colors.textPrimary, fontSize: scaleFont(18) },
                ]}
              >
                Resumo do Cadastro:
              </Text>
              <Text
                style={[
                  styles.reviewItem,
                  { color: colors.textMuted, fontSize: scaleFont(17) },
                ]}
              >
                • Remédio: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{name} ({strength})</Text>
              </Text>
              <Text
                style={[
                  styles.reviewItem,
                  { color: colors.textMuted, fontSize: scaleFont(17) },
                ]}
              >
                • Dose: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{doseAmount} {doseUnit}(s)</Text>
              </Text>
              <Text
                style={[
                  styles.reviewItem,
                  { color: colors.textMuted, fontSize: scaleFont(17) },
                ]}
              >
                • Horários: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{times.join(', ')}</Text>
              </Text>
              <Text
                style={[
                  styles.reviewItem,
                  { color: colors.textMuted, fontSize: scaleFont(17) },
                ]}
              >
                • Gaveta na caixa: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Gaveta {drawer}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Botão de avançar ou finalizar */}
        <View style={styles.navigationButtons}>
          {step < 6 ? (
            <AccessibleButton
              title="Avançar para o próximo passo →"
              onPress={handleNext}
              variant="primary"
              size="large"
            />
          ) : (
            <AccessibleButton
              title="✔ Salvar e programar na caixa"
              onPress={handleFinish}
              variant="success"
              size="large"
            />
          )}
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
  progressContainer: {
    marginBottom: 12,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  errorBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontWeight: '700',
  },
  stepCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardQuestion: {
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 28,
  },
  cardHelp: {
    marginBottom: 8,
  },
  inputLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitChipText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  checkboxBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  checkboxLabel: {
    flex: 1,
    lineHeight: 22,
  },
  selectedDrawerBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  selectedDrawerText: {},
  reviewSummary: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  reviewTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
  reviewItem: {
    marginVertical: 2,
  },
  navigationButtons: {
    gap: 10,
  },
});
