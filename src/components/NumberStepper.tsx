import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface NumberStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unitLabel?: string;
  label?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unitLabel,
  label,
}) => {
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: colors.textPrimary, fontSize: scaleFont(18) },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.stepperRow,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderWidth: colors.borderWidth,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={value <= min}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label || 'valor'}`}
          style={[
            styles.stepperButton,
            {
              backgroundColor: colors.bgCanvas,
              borderColor: colors.borderStrong,
              borderWidth: isHighContrast ? 2 : 1.5,
            },
            value <= min && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.textPrimary, fontSize: scaleFont(28) },
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.valueDisplay}>
          <Text
            style={[
              styles.valueText,
              { color: colors.textPrimary, fontSize: scaleFont(28) },
            ]}
          >
            {value}
          </Text>
          {unitLabel && (
            <Text
              style={[
                styles.unitText,
                { color: colors.textMuted, fontSize: scaleFont(16) },
              ]}
            >
              {unitLabel}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          disabled={value >= max}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label || 'valor'}`}
          style={[
            styles.stepperButton,
            {
              backgroundColor: colors.bgCanvas,
              borderColor: colors.borderStrong,
              borderWidth: isHighContrast ? 2 : 1.5,
            },
            value >= max && styles.buttonDisabled,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.textPrimary, fontSize: scaleFont(28) },
            ]}
          >
            ＋
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 6,
  },
  stepperButton: {
    width: 60,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontWeight: '700',
  },
  valueDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  valueText: {
    fontWeight: '800',
  },
  unitText: {
    fontWeight: '600',
  },
});
