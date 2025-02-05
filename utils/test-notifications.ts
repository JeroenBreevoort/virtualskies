import { FavoriteFlightsService } from './FavoriteFlightsService';

async function testNotifications() {
  try {
    // First add a test flight
    await FavoriteFlightsService.addFavorite({
      callsign: 'TEST123',
      departure: 'EHAM',
      arrival: 'EGLL',
      aircraft: 'B738'
    });
    
    console.log('Added test flight TEST123');
    
    // Wait a moment to ensure the flight is added
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now mark it as completed
    await FavoriteFlightsService.markFlightAsCompleted('TEST123', new Date().toISOString());
    
    console.log('Marked TEST123 as completed - you should receive a push notification shortly');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testNotifications(); 