import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { migrateDbIfNeeded } from '../utils/Database';
import { DatabaseProvider } from '../utils/DatabaseContext';
import { View, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    const initDatabase = async () => {
      const database = SQLite.openDatabaseSync('flights.db');
      await migrateDbIfNeeded(database);
      setDb(database);
    };
    
    initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  useEffect(() => {
    // Request notification permissions
    NotificationService.requestPermissions();

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'settings') {
        router.push('/(tabs)/settings');
      }
    });

    return () => subscription.remove();
  }, []);

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