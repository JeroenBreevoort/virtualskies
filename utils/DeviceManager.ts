import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

const DEVICE_ID_KEY = 'virtual_skies_device_id';

export class DeviceManager {
  static async getOrCreateDeviceId(): Promise<string> {
    try {
      // Try to get existing device ID
      let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      
      if (!deviceId) {
        // Ensure device info is available before accessing modelName
        const deviceName = Device.modelName || 'unknown-device';
        deviceId = `${deviceName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
        
        // Register the new device ID with Supabase
        await this.registerDeviceId(deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error managing device ID:', error);
      throw error;
    }
  }

  private static async registerDeviceId(deviceId: string) {
    try {
      // We'll add push token registration here later
      console.log('Device ID registered:', deviceId);
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  static async updatePushToken(pushToken: string) {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      
      // First check if the device exists
      const { data: existingDevice } = await supabase
        .from('push_tokens')
        .select('device_id')
        .eq('device_id', deviceId)
        .single();

      if (existingDevice) {
        // Device exists, update the token
        const { error } = await supabase
          .from('push_tokens')
          .update({ expo_push_token: pushToken })
          .eq('device_id', deviceId);

        if (error) throw error;
      } else {
        // Device doesn't exist, insert new record
        const { error } = await supabase
          .from('push_tokens')
          .insert({
            device_id: deviceId,
            expo_push_token: pushToken
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating push token:', error);
      // Log the error but don't throw it to prevent app disruption
      // This is a non-critical error that shouldn't break the app flow
      console.warn('Notification setup failed:', error);
    }
  }
} 