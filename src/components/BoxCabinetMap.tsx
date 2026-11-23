import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { DrawerId } from '../domain/types';
import { LedMode } from '../device';
import { useAppTheme } from '../theme/useAppTheme';

interface DrawerDisplayInfo {
  medicationName?: string;
  isOpen: boolean;
  led: LedMode;
}

interface BoxCabinetMapProps {
  drawersState: Record<DrawerId, DrawerDisplayInfo>;
  highlightDrawers?: DrawerId[];
  selectedDrawer?: DrawerId | null;
  disabledDrawers?: DrawerId[];
  onSelectDrawer?: (drawer: DrawerId) => void;
  interactiveToggle?: boolean;
}

export const BoxCabinetMap: React.FC<BoxCabinetMapProps> = ({
  drawersState,
  highlightDrawers = [],
  selectedDrawer = null,
  disabledDrawers = [],
  onSelectDrawer,
}) => {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  const renderDrawer = (id: DrawerId) => {
    const info = drawersState[id] || {
      isOpen: false,
      led: 'off',
      medicationName: 'Livre',
    };
    const isHighlighted = highlightDrawers.includes(id);
    const isSelected = selectedDrawer === id;
    const isDisabled = disabledDrawers.includes(id);

    const getLedColor = () => {
      if (info.led === 'on' || info.led === 'blink') return '#E6A100';
      return '#9AA9B8';
    };

    const getLedText = () => {
      if (info.led === 'blink') return 'Piscando';
      if (info.led === 'on') return 'Aceso';
      return 'Apagado';
    };

    const isClickable = !!onSelectDrawer && !isDisabled;

    return (
      <TouchableOpacity
        key={id}
        disabled={!isClickable}
        onPress={() => onSelectDrawer && onSelectDrawer(id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Gaveta ${id}, ${info.isOpen ? 'aberta' : 'fechada'}, ${info.medicationName || 'Livre'}, LED ${getLedText()}`}
        accessibilityHint={
          isClickable ? `Toque para selecionar a Gaveta ${id}` : undefined
        }
        style={[
          styles.drawerCell,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderWidth: colors.borderWidth,
          },
          info.isOpen && [
            styles.drawerOpen,
            { borderColor: colors.accentGold, backgroundColor: colors.accentGoldBg },
          ],
          isHighlighted && [
            styles.drawerHighlighted,
            {
              borderColor: isHighContrast ? '#000000' : '#E6A100',
              borderWidth: colors.borderWidthStrong,
              backgroundColor: isHighContrast ? '#FFFFFF' : '#FFFBEB',
            },
          ],
          isSelected && [
            styles.drawerSelected,
            {
              borderColor: colors.primary,
              borderWidth: colors.borderWidthStrong,
              backgroundColor: colors.primaryBg,
            },
          ],
          isDisabled && styles.drawerDisabled,
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text
            style={[
              styles.drawerNumber,
              { color: colors.textPrimary, fontSize: scaleFont(19) },
              isHighlighted && {
                color: isHighContrast ? '#000000' : colors.accentGold,
                fontSize: scaleFont(21),
              },
            ]}
          >
            Gaveta {id}
          </Text>
          <View
            style={[
              styles.ledIndicator,
              {
                backgroundColor: getLedColor(),
                borderColor: isHighContrast ? '#000000' : '#334E39',
              },
              info.led === 'blink' && styles.ledBlink,
            ]}
          />
        </View>

        <Text
          style={[
            styles.medName,
            { color: colors.textPrimary, fontSize: scaleFont(18) },
            isDisabled && styles.medNameDisabled,
          ]}
          numberOfLines={2}
        >
          {info.medicationName || 'Livre'}
        </Text>

        <View style={styles.statusFooter}>
          <Text
            style={[
              styles.doorState,
              { fontSize: scaleFont(15) },
              info.isOpen
                ? { color: colors.accentGold }
                : { color: colors.textMuted },
            ]}
          >
            {info.isOpen ? 'Aberta' : 'Fechada'}
          </Text>
          {isDisabled ? (
            <Text
              style={[
                styles.occupiedBadge,
                { color: colors.urgent, fontSize: scaleFont(14) },
              ]}
            >
              Ocupada
            </Text>
          ) : (
            <Text
              style={[
                styles.ledStatusText,
                { color: colors.textMuted, fontSize: scaleFont(14) },
                (info.led === 'on' || info.led === 'blink') && {
                  color: colors.accentGold,
                },
              ]}
            >
              {getLedText()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.cabinetContainer,
        {
          backgroundColor: colors.cabinet,
          borderWidth: isHighContrast ? 3 : 0,
          borderColor: '#000000',
        },
      ]}
    >
      <View style={styles.cabinetHeader}>
        <Text style={[styles.cabinetTitle, { fontSize: scaleFont(17) }]}>
          Caixa AMAZCARE (Visão Frontal)
        </Text>
      </View>
      <View style={styles.columnsWrapper}>
        {/* Coluna Esquerda: Gavetas 1, 2, 3 */}
        <View style={styles.column}>
          {renderDrawer(1)}
          {renderDrawer(2)}
          {renderDrawer(3)}
        </View>

        {/* Coluna Direita: Gavetas 4, 5, 6 */}
        <View style={styles.column}>
          {renderDrawer(4)}
          {renderDrawer(5)}
          {renderDrawer(6)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cabinetContainer: {
    borderRadius: 18,
    padding: 12,
    marginVertical: 12,
  },
  cabinetHeader: {
    marginBottom: 8,
    alignItems: 'center',
  },
  cabinetTitle: {
    color: '#D8F2E6',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  columnsWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  drawerCell: {
    borderRadius: 12,
    padding: 10,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  drawerOpen: {
    borderStyle: 'dashed',
  },
  drawerHighlighted: {},
  drawerSelected: {},
  drawerDisabled: {
    backgroundColor: '#F0F3F0',
    borderColor: '#D4DDD5',
    opacity: 0.75,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerNumber: {
    fontWeight: '700',
  },
  drawerNumberHighlighted: {
    fontWeight: '800',
  },
  ledIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  ledBlink: {
    borderWidth: 2,
    backgroundColor: '#FFB800',
  },
  medName: {
    fontWeight: '700',
    marginVertical: 4,
  },
  medNameDisabled: {
    color: '#607D67',
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  doorState: {
    fontWeight: '700',
  },
  occupiedBadge: {
    fontWeight: '700',
  },
  ledStatusText: {
    fontWeight: '700',
  },
});
