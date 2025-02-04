import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
        },
      });
      return status === 'granted';
    }
    return true;
  }

  static async scheduleFlightCompletionNotification(callsign: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Flight Completed',
        body: `Flight ${callsign} has been completed`,
        data: { screen: 'settings' }, // This will be used to navigate to favorites
      },
      trigger: null, // Immediate notification
    });
  }
} 