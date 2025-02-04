import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { migrateDbIfNeeded } from '../utils/Database';
import { DatabaseProvider } from '../utils/DatabaseContext';
import { View, ActivityIndicator } from 'react-native';
import Colors from '../constants/Colors';

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