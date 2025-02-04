import React, { createContext, useContext } from 'react';
import { SQLiteDatabase } from 'expo-sqlite';

interface DatabaseContextType {
  db: SQLiteDatabase | null;
}

export const DatabaseContext = createContext<DatabaseContextType>({ db: null });

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context.db) {
    throw new Error('Database not initialized');
  }
  return context.db;
}

interface DatabaseProviderProps {
  db: SQLiteDatabase;
  children: React.ReactNode;
}

export function DatabaseProvider({ db, children }: DatabaseProviderProps) {
  return (
    <DatabaseContext.Provider value={{ db }}>
      {children}
    </DatabaseContext.Provider>
  );
} 