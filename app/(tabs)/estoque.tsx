import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { HeaderWithSettings } from '../../src/components/HeaderWithSettings';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { NumberStepper } from '../../src/components/NumberStepper';
import { useMedicationStore } from '../../src/store/useMedicationStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { calculateStockEstimate } from '../../src/domain/stock';
import { Medication, StockEstimate } from '../../src/domain/types';

export default function EstoqueScreen() {
  const medications = useMedicationStore((s) => s.medications);
  const addStockUnits = useMedicationStore((s) => s.addStockUnits);
  const setExactStock = useMedicationStore((s) => s.setExactStock);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const [modalState, setModalState] = React.useState<{
    visible: boolean;
    type: 'refill' | 'adjust';
    med: Medication | null;
    value: number;
  }>({
    visible: false,
    type: 'refill',
    med: null,
    value: 10,
  });

  const activeMeds = medications.filter((m) => !m.archivedAt);

  const openRefill = (med: Medication) => {
    setModalState({
      visible: true,
      type: 'refill',
      med,
      value: 10,
    });
  };

  const openAdjust = (med: Medication) => {
    setModalState({
      visible: true,
      type: 'adjust',
      med,
      value: med.stock.estimated,
    });
  };

  const handleSaveModal = async () => {
    if (!modalState.med) return;
    if (modalState.type === 'refill') {
      await addStockUnits(modalState.med.id, modalState.value);
    } else {
      await setExactStock(modalState.med.id, modalState.value);
    }
    setModalState({ visible: false, type: 'refill', med: null, value: 0 });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <HeaderWithSettings title="Controle de Estoque" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de transparência e limitação de hardware */}
        <View
          style={[
            styles.disclaimerCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderStrong,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.disclaimerTitle,
              { color: colors.primary, fontSize: scaleFont(20) },
            ]}
          >
            ℹ Quantidade Estimada
          </Text>
          <Text
            style={[
              styles.disclaimerText,
              { color: colors.textMuted, fontSize: scaleFont(17) },
            ]}
          >
            O sensor eletrônico da caixa detecta apenas a abertura e fechamento
            das gavetas. O estoque é reduzido automaticamente a cada dose
            tomada. Ajuste os valores sempre que reabastecer os frascos.
          </Text>
        </View>

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
                styles.emptyText,
                { color: colors.textMuted, fontSize: scaleFont(19) },
              ]}
            >
              Nenhum medicamento ativo cadastrado.
            </Text>
          </View>
        ) : (
          activeMeds.map((med) => {
            const estimate = calculateStockEstimate(med);
            const maxRef = Math.max(med.stock.minAlert * 4, 20);
            const fillPercent = Math.min(
              100,
              Math.max(4, (estimate.estimated / maxRef) * 100)
            );

            const isLow = estimate.status === 'baixo';
            const isEmpty = estimate.status === 'esgotado';

            const barColor = isEmpty
              ? colors.urgent
              : isLow
              ? colors.accentGold
              : colors.primary;

            return (
              <View
                key={med.id}
                style={[
                  styles.stockCard,
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
                      styles.statusChip,
                      {
                        backgroundColor: isEmpty
                          ? colors.urgentBg
                          : isLow
                          ? colors.accentGoldBg
                          : colors.primaryBg,
                        borderWidth: isHighContrast ? 2 : 0,
                        borderColor: barColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: barColor,
                          fontSize: scaleFont(15),
                        },
                      ]}
                    >
                      {isEmpty
                        ? '✖ Esgotado'
                        : isLow
                        ? '⚠ Estoque baixo'
                        : '✔ Suficiente'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.infoText,
                    { color: colors.textMuted, fontSize: scaleFont(17) },
                  ]}
                >
                  Gaveta {med.drawer} · Posologia: {med.dose.amount}{' '}
                  {med.dose.unit}(s) ({med.times.length}x ao dia)
                </Text>

                <View style={styles.estimateBox}>
                  <Text
                    style={[
                      styles.estimateBigNumber,
                      { color: colors.textPrimary, fontSize: scaleFont(34) },
                    ]}
                  >
                    {estimate.estimated}{' '}
                    <Text
                      style={[
                        styles.estimateUnit,
                        { color: colors.textMuted, fontSize: scaleFont(20) },
                      ]}
                    >
                      {med.dose.unit}(s)
                    </Text>
                  </Text>
                  <Text
                    style={[
                      styles.daysRemainingText,
                      { color: colors.textMuted, fontSize: scaleFont(19) },
                    ]}
                  >
                    Dá para aproximadamente{' '}
                    <Text style={{ fontWeight: '800', color: barColor }}>
                      {estimate.daysRemaining} dia
                      {estimate.daysRemaining === 1 ? '' : 's'}
                    </Text>
                  </Text>
                </View>

                {/* Barra de nível visual com indicação textual */}
                <View
                  style={[
                    styles.barTrack,
                    {
                      backgroundColor: isHighContrast ? '#CBD7CD' : '#E8EFE9',
                      borderWidth: isHighContrast ? 1 : 0,
                      borderColor: '#000000',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      { width: `${fillPercent}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.minAlertText,
                    { color: colors.textMuted, fontSize: scaleFont(15) },
                  ]}
                >
                  Aviso configurado para: menos de {med.stock.minAlert} unidades
                </Text>

                {/* Botões de Ação */}
                <View style={styles.actionsRow}>
                  <AccessibleButton
                    title="＋ Coloquei mais remédios"
                    onPress={() => openRefill(med)}
                    variant="primary"
                    style={{ flex: 1 }}
                  />
                  <AccessibleButton
                    title="✎ Corrigir quantidade"
                    onPress={() => openAdjust(med)}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para Adicionar Unidades ou Corrigir Quantidade */}
      <Modal
        visible={modalState.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalState({ visible: false, type: 'refill', med: null, value: 0 })
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setModalState({
              visible: false,
              type: 'refill',
              med: null,
              value: 0,
            })
          }
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.bgSurface,
                borderColor: isHighContrast ? '#000000' : colors.borderStrong,
                borderWidth: colors.borderWidthStrong,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.textPrimary, fontSize: scaleFont(24) },
              ]}
            >
              {modalState.type === 'refill'
                ? 'Coloquei mais remédios'
                : 'Corrigir quantidade'}
            </Text>
            <Text
              style={[
                styles.modalSub,
                { color: colors.textMuted, fontSize: scaleFont(18) },
              ]}
            >
              {modalState.med?.name} (Gaveta {modalState.med?.drawer})
            </Text>

            <NumberStepper
              label={
                modalState.type === 'refill'
                  ? 'Quantos comprimidos você adicionou à gaveta?'
                  : 'Qual a quantidade real de comprimidos na gaveta agora?'
              }
              value={modalState.value}
              onChange={(v) => setModalState((prev) => ({ ...prev, value: v }))}
              min={0}
              max={300}
              step={modalState.type === 'refill' ? 5 : 1}
              unitLabel={modalState.med?.dose.unit || 'unidades'}
            />

            <View style={styles.modalActions}>
              <AccessibleButton
                title="✔ Salvar no Estoque"
                onPress={handleSaveModal}
                variant="success"
                size="large"
              />
              <AccessibleButton
                title="Cancelar"
                onPress={() =>
                  setModalState({
                    visible: false,
                    type: 'refill',
                    med: null,
                    value: 0,
                  })
                }
                variant="outline"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  disclaimerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#334E39',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B5A25',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 17,
    color: '#2D4233',
    lineHeight: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 19,
    color: '#4A6078',
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD7CD',
    padding: 18,
    marginBottom: 14,
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
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statusChipText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 17,
    color: '#4A6078',
    marginTop: 4,
  },
  estimateBox: {
    marginVertical: 12,
  },
  estimateBigNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0A1C10',
  },
  estimateUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D4233',
  },
  daysRemainingText: {
    fontSize: 19,
    color: '#2D4233',
    marginTop: 2,
  },
  barTrack: {
    height: 14,
    backgroundColor: '#E8EFE9',
    borderRadius: 7,
    overflow: 'hidden',
    marginVertical: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  minAlertText: {
    fontSize: 15,
    color: '#4A6078',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 25, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334E39',
    padding: 22,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C10',
  },
  modalSub: {
    fontSize: 18,
    color: '#2D4233',
    marginVertical: 4,
    marginBottom: 12,
  },
  modalActions: {
    marginTop: 16,
    gap: 8,
  },
});
