import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DeviceManager } from './DeviceManager';

export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
        },
      });
      
      if (status === 'granted') {
        // Get the token and store it
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await DeviceManager.updatePushToken(token);
      }
      
      return status === 'granted';
    }
    return true;
  }

  static async scheduleFlightCompletionNotification(callsign: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Flight Completed',
          body: `Flight ${callsign} has been completed`,
          data: { screen: 'settings' }, // This will be used to navigate to favorites
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const permissionResult = await this.requestPermissions();
        finalStatus = permissionResult ? existingStatus : existingStatus;
      }

      if (finalStatus === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await DeviceManager.updatePushToken(token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }
} 