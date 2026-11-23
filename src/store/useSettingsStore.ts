import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TextScalePreference = 'normal' | 'large' | 'extra';

interface SettingsState {
  textScale: TextScalePreference;
  highContrast: boolean;
  voiceInstructions: boolean;
  toleranceMinutes: number;
  simulatedClockOffsetMs: number;

  setTextScale: (scale: TextScalePreference) => void;
  setHighContrast: (enabled: boolean) => void;
  setVoiceInstructions: (enabled: boolean) => void;
  setToleranceMinutes: (minutes: number) => void;
  advanceClock: (milliseconds: number) => void;
  resetClock: () => void;
  getNow: () => Date;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      textScale: 'normal',
      highContrast: false,
      voiceInstructions: true,
      toleranceMinutes: 60,
      simulatedClockOffsetMs: 0,

      setTextScale: (scale) => set({ textScale: scale }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),
      setVoiceInstructions: (enabled) => set({ voiceInstructions: enabled }),
      setToleranceMinutes: (minutes) =>
        set({ toleranceMinutes: Math.max(5, minutes) }),
      advanceClock: (ms) =>
        set((state) => ({
          simulatedClockOffsetMs: state.simulatedClockOffsetMs + ms,
        })),
      resetClock: () => set({ simulatedClockOffsetMs: 0 }),
      getNow: () => {
        const offset = get().simulatedClockOffsetMs;
        return new Date(Date.now() + offset);
      },
    }),
    {
      name: 'amazcare-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        textScale: state.textScale,
        highContrast: state.highContrast,
        voiceInstructions: state.voiceInstructions,
        toleranceMinutes: state.toleranceMinutes,
      }),
    }
  )
);
