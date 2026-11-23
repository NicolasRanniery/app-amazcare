import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface TimePresetPickerProps {
  times: string[];
  onChange: (times: string[]) => void;
}

const PRESETS = [
  { label: 'Manhã (08:00)', value: '08:00' },
  { label: 'Almoço (12:00)', value: '12:00' },
  { label: 'Tarde (16:00)', value: '16:00' },
  { label: 'Noite (20:00)', value: '20:00' },
];

export const TimePresetPicker: React.FC<TimePresetPickerProps> = ({
  times,
  onChange,
}) => {
  const { colors, scaleFont, isHighContrast } = useAppTheme();
  const [customTime, setCustomTime] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const togglePreset = (val: string) => {
    if (times.includes(val)) {
      if (times.length > 1) {
        onChange(times.filter((t) => t !== val));
      }
    } else {
      onChange([...times, val].sort());
    }
  };

  const handleAddCustom = () => {
    const trimmed = customTime.trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
      setErrorMsg('Use formato HH:MM (ex: 09:30)');
      return;
    }
    if (!times.includes(trimmed)) {
      onChange([...times, trimmed].sort());
      setCustomTime('');
      setErrorMsg('');
    }
  };

  const removeTime = (t: string) => {
    if (times.length > 1) {
      onChange(times.filter((item) => item !== t));
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.sectionLabel,
          { color: colors.textPrimary, fontSize: scaleFont(18) },
        ]}
      >
        Horários programados:
      </Text>
      <View style={styles.chipsRow}>
        {times.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => removeTime(t)}
            style={[
              styles.timeChip,
              {
                backgroundColor: colors.primary,
                borderColor: isHighContrast ? '#000000' : 'transparent',
                borderWidth: isHighContrast ? 2 : 0,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Horário ${t}. Toque para remover.`}
          >
            <Text
              style={[
                styles.timeChipText,
                { fontSize: scaleFont(18) },
              ]}
            >
              {t} ✕
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text
        style={[
          styles.sectionLabel,
          { color: colors.textPrimary, fontSize: scaleFont(18), marginTop: 12 },
        ]}
      >
        Toque para adicionar horários comuns:
      </Text>
      <View style={styles.presetsGrid}>
        {PRESETS.map((p) => {
          const isSelected = times.includes(p.value);
          return (
            <TouchableOpacity
              key={p.value}
              onPress={() => togglePreset(p.value)}
              style={[
                styles.presetBtn,
                {
                  backgroundColor: isSelected
                    ? colors.primaryBg
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
              accessibilityLabel={`${p.label}, ${isSelected ? 'selecionado' : 'não selecionado'}`}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color: isSelected ? colors.primary : colors.textPrimary,
                    fontSize: scaleFont(16),
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <TextInput
          placeholder="Outro horário (ex: 07:30)"
          placeholderTextColor={colors.textMuted}
          value={customTime}
          onChangeText={(v) => {
            setCustomTime(v);
            setErrorMsg('');
          }}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={[
            styles.customInput,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderWidth: colors.borderWidth,
              color: colors.textPrimary,
              fontSize: scaleFont(18),
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleAddCustom}
          style={[
            styles.addBtn,
            {
              backgroundColor: colors.borderStrong,
              borderColor: isHighContrast ? '#000000' : 'transparent',
              borderWidth: isHighContrast ? 2 : 0,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Adicionar horário customizado"
        >
          <Text
            style={[
              styles.addBtnText,
              { fontSize: scaleFont(17) },
            ]}
          >
            ＋ Adicionar
          </Text>
        </TouchableOpacity>
      </View>
      {errorMsg ? (
        <Text
          style={[
            styles.errorText,
            { color: colors.urgent, fontSize: scaleFont(16) },
          ]}
        >
          {errorMsg}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetText: {
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  addBtn: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    fontWeight: '700',
    marginTop: 6,
  },
});
