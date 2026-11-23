import { useSettingsStore, TextScalePreference } from '../store/useSettingsStore';

export interface ThemeColors {
  bgCanvas: string;
  bgSurface: string;
  borderSubtle: string;
  borderStrong: string;
  borderWidth: number;
  borderWidthStrong: number;
  textPrimary: string;
  textMuted: string;
  primary: string;
  primaryBg: string;
  secondary: string;
  secondaryBg: string;
  urgent: string;
  urgentBg: string;
  accentGold: string;
  accentGoldBg: string;
  cabinet: string;
  cardElevation: number;
}

export function useAppTheme() {
  const highContrast = useSettingsStore((s) => s.highContrast);
  const textScale = useSettingsStore((s) => s.textScale);

  const scaleFont = (baseSize: number): number => {
    switch (textScale) {
      case 'large':
        return Math.round(baseSize * 1.15);
      case 'extra':
        return Math.round(baseSize * 1.30);
      case 'normal':
      default:
        return baseSize;
    }
  };

  const colors: ThemeColors = highContrast
    ? {
        bgCanvas: '#FFFFFF',
        bgSurface: '#FFFFFF',
        borderSubtle: '#000000',
        borderStrong: '#000000',
        borderWidth: 3,
        borderWidthStrong: 4,
        textPrimary: '#000000',
        textMuted: '#000000',
        primary: '#004D1A',
        primaryBg: '#E8F5E9',
        secondary: '#002E7A',
        secondaryBg: '#E3F2FD',
        urgent: '#8B0000',
        urgentBg: '#FFEBEE',
        accentGold: '#663C00',
        accentGoldBg: '#FFF8E1',
        cabinet: '#000000',
        cardElevation: 0,
      }
    : {
        bgCanvas: '#F4F7F4',
        bgSurface: '#FFFFFF',
        borderSubtle: '#CBD7CD',
        borderStrong: '#334E39',
        borderWidth: 2,
        borderWidthStrong: 2.5,
        textPrimary: '#0A1C10',
        textMuted: '#2D4233',
        primary: '#0B5A25',
        primaryBg: '#D8F2E6',
        secondary: '#0D47A1',
        secondaryBg: '#DCEBFA',
        urgent: '#A31610',
        urgentBg: '#FDE8E7',
        accentGold: '#8F5300',
        accentGoldBg: '#FFF3D6',
        cabinet: '#1A3B28',
        cardElevation: 2,
      };

  return {
    isHighContrast: highContrast,
    textScale,
    scaleFont,
    colors,
  };
}
