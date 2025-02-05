import React from 'react';
import { View, Button, Text } from 'react-native';
import { FavoriteFlightsService } from '../utils/FavoriteFlightsService';

export function NotificationTest() {
  const [status, setStatus] = React.useState<string>('');

  const testNotification = async () => {
    try {
      setStatus('Adding test flight...');
      
      // First add a test flight
      await FavoriteFlightsService.addFavorite({
        callsign: 'TEST123',
        departure: 'EHAM',
        arrival: 'EGLL',
        aircraft: 'B738'
      });
      
      setStatus('Test flight added, marking as completed...');
      
      // Wait a moment to ensure the flight is added
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now mark it as completed
      await FavoriteFlightsService.markFlightAsCompleted('TEST123', new Date().toISOString());
      
      setStatus('Flight marked as completed - you should receive a notification shortly');
    } catch (error: any) {
      setStatus(`Error: ${error?.message || 'Unknown error occurred'}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button 
        title="Test Push Notification" 
        onPress={testNotification}
      />
      {status ? (
        <Text style={{ marginTop: 10 }}>{status}</Text>
      ) : null}
    </View>
  );
} 