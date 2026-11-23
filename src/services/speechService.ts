import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

export const speechService = {
  async speak(text: string, options?: SpeakOptions): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: 'pt-BR',
        rate: options?.rate ?? 0.85, // Levemente mais lento para facilitar compreensão por idosos
        pitch: options?.pitch ?? 1.0,
      });
    } catch (e) {
      console.warn('Speech error or not available:', e);
    }
  },

  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {}
  },
};
