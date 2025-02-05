import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { migrateDbIfNeeded } from '../utils/Database';
import { DatabaseProvider } from '../utils/DatabaseContext';
import { View, ActivityIndicator, Text } from 'react-native';
import Colors from '../constants/Colors';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { NotificationService } from '../utils/NotificationService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initial database setup
        const database = SQLite.openDatabaseSync('flights.db');
        
        // Keep splash screen visible
        setIsReady(true);
        
        // Defer migrations and heavy operations
        setTimeout(async () => {
          try {
            await migrateDbIfNeeded(database);
            setDb(database);
            
            // Defer notification setup
            setTimeout(async () => {
              try {
                await NotificationService.requestPermissions();
              } catch (error) {
                console.warn('Notification setup failed:', error);
              }
            }, 1000);
          } catch (error) {
            console.error('Migration failed:', error);
            setIsError('Failed to initialize app. Please try again.');
          }
        }, 100);
      } catch (error) {
        console.error('Critical initialization failed:', error);
        setIsError('Failed to initialize app. Please try again.');
      }
    }
    
    prepare();
  }, []);

  useEffect(() => {
    if (!db) return;

    // Only set up notification handling after database is ready
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'settings') {
        router.push('/(tabs)/settings');
      }
    });

    return () => subscription.remove();
  }, [db]);

  if (!isReady) {
    return null; // Keep splash screen visible
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>{isError}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <DatabaseProvider db={db}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </DatabaseProvider>
  );
} 