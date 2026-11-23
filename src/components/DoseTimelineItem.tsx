import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScheduledDose, DoseStatus } from '../domain/types';
import { useAppTheme } from '../theme/useAppTheme';

interface DoseTimelineItemProps {
  dose: ScheduledDose;
  onTakeDose?: () => void;
  onMissDose?: () => void;
}

export const DoseTimelineItem: React.FC<DoseTimelineItemProps> = ({
  dose,
  onTakeDose,
  onMissDose,
}) => {
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const getStatusBadge = (status: DoseStatus) => {
    switch (status) {
      case 'registrada':
        return {
          label: '✔ Tomado',
          bgColor: isHighContrast ? '#E8F5E9' : '#D8F2E6',
          textColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'andamento':
        return {
          label: '⏰ Em andamento',
          bgColor: isHighContrast ? '#FFF8E1' : '#FFF3D6',
          textColor: colors.accentGold,
          borderColor: colors.accentGold,
        };
      case 'atrasada':
        return {
          label: '⚠ Atrasado',
          bgColor: isHighContrast ? '#FFEBEE' : '#FDE8E7',
          textColor: colors.urgent,
          borderColor: colors.urgent,
        };
      case 'esquecida':
        return {
          label: '✖ Esquecido',
          bgColor: isHighContrast ? '#FFEBEE' : '#FDE8E7',
          textColor: colors.urgent,
          borderColor: colors.urgent,
        };
      case 'pendente':
      default:
        return {
          label: '⏳ Pendente',
          bgColor: isHighContrast ? '#E3F2FD' : '#DCEBFA',
          textColor: colors.secondary,
          borderColor: colors.secondary,
        };
    }
  };

  const badge = getStatusBadge(dose.status);

  return (
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
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.timeText,
            { color: colors.textPrimary, fontSize: scaleFont(26) },
          ]}
        >
          {dose.time}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: badge.bgColor,
              borderColor: badge.borderColor,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: badge.textColor, fontSize: scaleFont(16) },
            ]}
          >
            {badge.label}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.medName,
          { color: colors.textPrimary, fontSize: scaleFont(22) },
        ]}
      >
        {dose.medication.name}
      </Text>
      <Text
        style={[
          styles.detailsText,
          { color: colors.textMuted, fontSize: scaleFont(18) },
        ]}
      >
        {dose.medication.strength} · {dose.medication.dose.amount}{' '}
        {dose.medication.dose.unit}(s)
      </Text>

      <View
        style={[
          styles.drawerBadge,
          {
            backgroundColor: colors.bgCanvas,
            borderColor: colors.borderSubtle,
            borderWidth: colors.borderWidth,
          },
        ]}
      >
        <Text
          style={[
            styles.drawerBadgeText,
            { color: colors.textPrimary, fontSize: scaleFont(16) },
          ]}
        >
          📦 Gaveta {dose.medication.drawer}
        </Text>
      </View>

      {/* Ações manuais rápidas quando aplicável */}
      {(dose.status === 'pendente' || dose.status === 'atrasada') && (
        <View style={styles.actionsRow}>
          {onTakeDose && (
            <TouchableOpacity
              onPress={onTakeDose}
              style={[
                styles.actionBtn,
                styles.takeBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: isHighContrast ? '#000000' : 'transparent',
                  borderWidth: isHighContrast ? 2 : 0,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Confirmar que já tomou ${dose.medication.name}`}
            >
              <Text
                style={[
                  styles.takeBtnText,
                  { fontSize: scaleFont(18) },
                ]}
              >
                Já tomei
              </Text>
            </TouchableOpacity>
          )}
          {onMissDose && (
            <TouchableOpacity
              onPress={onMissDose}
              style={[
                styles.actionBtn,
                styles.missBtn,
                {
                  borderColor: colors.urgent,
                  borderWidth: colors.borderWidth,
                  backgroundColor: colors.bgSurface,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Registrar esquecimento de ${dose.medication.name}`}
            >
              <Text
                style={[
                  styles.missBtnText,
                  { color: colors.urgent, fontSize: scaleFont(17) },
                ]}
              >
                Não tomei
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statusText: {
    fontWeight: '700',
  },
  medName: {
    fontWeight: '700',
    marginVertical: 2,
  },
  detailsText: {
    marginBottom: 8,
  },
  drawerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  drawerBadgeText: {
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  takeBtn: {},
  takeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  missBtn: {},
  missBtnText: {
    fontWeight: '700',
  },
});
