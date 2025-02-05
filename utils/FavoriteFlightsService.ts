import { supabase } from '../lib/supabase';
import { DeviceManager } from './DeviceManager';
import { NotificationService } from './NotificationService';

export interface FavoriteFlight {
  id?: string;
  device_id: string;
  callsign: string;
  departure: string;
  arrival: string;
  aircraft: string;
  completed_at?: string | null;
  favorited_at: string;
  created_at?: string;
}

export class FavoriteFlightsService {
  static async addFavorite(flight: {
    callsign: string;
    departure: string;
    arrival: string;
    aircraft: string;
  }): Promise<void> {
    const deviceId = await DeviceManager.getOrCreateDeviceId();
    
    const { error } = await supabase
      .from('favorite_flights')
      .upsert({
        device_id: deviceId,
        callsign: flight.callsign,
        departure: flight.departure,
        arrival: flight.arrival,
        aircraft: flight.aircraft,
        favorited_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async removeFavorite(callsign: string): Promise<void> {
    const deviceId = await DeviceManager.getOrCreateDeviceId();
    
    const { error } = await supabase
      .from('favorite_flights')
      .delete()
      .match({ device_id: deviceId, callsign });

    if (error) throw error;
  }

  static async getFavorites(): Promise<FavoriteFlight[]> {
    const deviceId = await DeviceManager.getOrCreateDeviceId();
    
    const { data, error } = await supabase
      .from('favorite_flights')
      .select('*')
      .eq('device_id', deviceId);

    if (error) throw error;
    return data || [];
  }

  static async markFlightAsCompleted(
    callsign: string,
    completedAt: string
  ): Promise<void> {
    const deviceId = await DeviceManager.getOrCreateDeviceId();
    
    const { error } = await supabase
      .from('favorite_flights')
      .update({ completed_at: completedAt })
      .match({ device_id: deviceId, callsign });

    if (error) throw error;

    // Send local notification
    await NotificationService.scheduleFlightCompletionNotification(callsign);
  }
} 