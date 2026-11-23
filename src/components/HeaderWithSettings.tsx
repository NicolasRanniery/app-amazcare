import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAppTheme } from '../theme/useAppTheme';

interface HeaderWithSettingsProps {
  showBackButton?: boolean;
  backTitle?: string;
  onBack?: () => void;
  title?: string;
  hideSettingsButton?: boolean;
}

export const HeaderWithSettings: React.FC<HeaderWithSettingsProps> = ({
  showBackButton = false,
  backTitle = 'Voltar',
  onBack,
  title,
  hideSettingsButton = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  const getNow = useSettingsStore((s) => s.getNow);
  const [currentTime, setCurrentTime] = React.useState(getNow());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNow());
    }, 1000);
    return () => clearInterval(timer);
  }, [getNow]);

  const dateString = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const timeString = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Garante margem de segurança abaixo da barra de status, notch ou câmera frontal
  const statusBarHeight = RNStatusBar.currentHeight || 24;
  const safeTopPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, statusBarHeight) + 12
      : Math.max(insets.top, 16) + 8;

  // Oculta o botão de ajustes se estiver nas telas de ajustes ou se for requisitado
  const shouldHideSettings =
    hideSettingsButton ||
    pathname === '/ajustes' ||
    pathname === '/ajustes/demonstracao' ||
    pathname?.includes('ajustes');

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: safeTopPadding,
          backgroundColor: colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: colors.borderWidth,
        },
      ]}
    >
      <View style={styles.topRow}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => (onBack ? onBack() : router.back())}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={backTitle}
          >
            <Text
              style={[
                styles.backButtonText,
                { color: colors.primary, fontSize: scaleFont(19) },
              ]}
            >
              ← {backTitle}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.borderStrong,
                  borderWidth: isHighContrast ? 2 : 0,
                },
              ]}
            >
              <Text style={styles.logoText}>AMAZCARE</Text>
            </View>
          </View>
        )}

        {!shouldHideSettings && (
          <TouchableOpacity
            onPress={() => router.push('/ajustes')}
            style={[
              styles.settingsButton,
              {
                borderColor: colors.borderStrong,
                borderWidth: colors.borderWidth,
                backgroundColor: colors.bgCanvas,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Abrir Ajustes do aplicativo"
          >
            <Text
              style={[
                styles.settingsButtonText,
                { color: colors.textPrimary, fontSize: scaleFont(17) },
              ]}
            >
              ⚙ Ajustes
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.timeRow}>
        <Text
          style={[
            styles.dateText,
            { color: colors.textMuted, fontSize: scaleFont(17) },
          ]}
        >
          {dateString}
        </Text>
        <Text
          style={[
            styles.timeText,
            { color: colors.textPrimary, fontSize: scaleFont(20) },
          ]}
        >
          {timeString}
        </Text>
      </View>

      {title && (
        <Text
          style={[
            styles.screenTitle,
            { color: colors.textPrimary, fontSize: scaleFont(28) },
          ]}
        >
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: 12,
  },
  backButtonText: {
    fontWeight: '700',
  },
  settingsButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  timeText: {
    fontWeight: '800',
  },
  screenTitle: {
    fontWeight: '800',
    marginTop: 10,
  },
});
