import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'success';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  icon,
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, scaleFont, isHighContrast } = useAppTheme();
  const minHeight = size === 'large' ? 64 : 56;

  const getBackgroundColor = () => {
    if (disabled) return '#CBD7CD';
    switch (variant) {
      case 'primary':
      case 'success':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.urgentBg;
      case 'outline':
      default:
        return colors.bgSurface;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#607D67';
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
        return '#FFFFFF';
      case 'danger':
        return colors.urgent;
      case 'outline':
      default:
        return colors.textPrimary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#CBD7CD';
    if (isHighContrast) return colors.borderStrong;
    switch (variant) {
      case 'outline':
        return colors.borderStrong;
      case 'danger':
        return colors.urgent;
      default:
        return 'transparent';
    }
  };

  const borderWidth =
    variant === 'outline' || variant === 'danger' || isHighContrast
      ? colors.borderWidth
      : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        {
          minHeight,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: scaleFont(size === 'large' ? 22 : 19),
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
