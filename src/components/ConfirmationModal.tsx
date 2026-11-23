import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { AccessibleButton } from './AccessibleButton';
import { useAppTheme } from '../theme/useAppTheme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Sim, confirmar',
  cancelLabel = 'Não, cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialogCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: isHighContrast ? '#000000' : colors.borderStrong,
              borderWidth: colors.borderWidthStrong,
            },
          ]}
          accessibilityRole="alert"
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, fontSize: scaleFont(26) },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              { color: colors.textMuted, fontSize: scaleFont(20) },
            ]}
          >
            {message}
          </Text>

          <View style={styles.buttonStack}>
            <AccessibleButton
              title={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'danger' : 'primary'}
              size="large"
            />
            <AccessibleButton
              title={cancelLabel}
              onPress={onCancel}
              variant="outline"
              size="large"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 25, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  title: {
    fontWeight: '800',
    marginBottom: 10,
  },
  message: {
    lineHeight: 28,
    marginBottom: 20,
  },
  buttonStack: {
    gap: 10,
  },
});
