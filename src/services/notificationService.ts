import { Platform } from 'react-native';

let Notifications: typeof import('expo-notifications') | null = null;

try {
  Notifications = require('expo-notifications');
  if (Platform.OS !== 'web' && Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.warn(
    'Aviso: Módulo nativo expo-notifications não disponível no Expo Go Android. As notificações em segundo plano funcionarão via simulador ou build de desenvolvimento.',
    e
  );
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  },

  async scheduleDoseNotification(
    title: string,
    body: string,
    targetDate: Date,
    identifier: string
  ): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications) return null;
    try {
      await this.cancelNotification(identifier);
      const secondsFromNow = Math.floor(
        (targetDate.getTime() - Date.now()) / 1000
      );
      if (secondsFromNow <= 0) return null;

      const id = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
        },
      });
      return id;
    } catch {
      return null;
    }
  },

  async cancelNotification(identifier: string): Promise<void> {
    if (Platform.OS === 'web' || !Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {}
  },

  async cancelAll(): Promise<void> {
    if (Platform.OS === 'web' || !Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  },
};
