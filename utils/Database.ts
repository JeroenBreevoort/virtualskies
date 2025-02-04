import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      
      CREATE TABLE favorite_flights (
        id INTEGER PRIMARY KEY NOT NULL,
        callsign TEXT NOT NULL,
        departure TEXT NOT NULL,
        arrival TEXT NOT NULL,
        aircraft TEXT NOT NULL,
        airline_name TEXT,
        favorited_at INTEGER NOT NULL,
        completed_at INTEGER,
        flight_duration INTEGER,
        flight_data TEXT
      );

      CREATE INDEX idx_favorite_flights_callsign ON favorite_flights(callsign);
    `);
    currentDbVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

interface FavoriteFlight {
  id?: number;
  callsign: string;
  departure: string;
  arrival: string;
  aircraft: string;
  airline_name: string | null;
  favorited_at: number;
  completed_at: number | null;
  flight_duration: number | null;
  flight_data: string | null;
}

export const addFavoriteFlight = async (db: SQLiteDatabase, flight: Omit<FavoriteFlight, 'id'>) => {
  try {
    await db.runAsync(
      `INSERT INTO favorite_flights (
        callsign, departure, arrival, aircraft, airline_name, 
        favorited_at, completed_at, flight_duration, flight_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        flight.callsign,
        flight.departure,
        flight.arrival,
        flight.aircraft,
        flight.airline_name || null,
        flight.favorited_at,
        flight.completed_at || null,
        flight.flight_duration || null,
        flight.flight_data || null
      ]
    );
  } catch (error) {
    console.error('Error in addFavoriteFlight:', error);
    throw error;
  }
};

export const removeFavoriteFlight = async (db: SQLiteDatabase, callsign: string) => {
  try {
    await db.runAsync('DELETE FROM favorite_flights WHERE callsign = ?', [callsign]);
  } catch (error) {
    console.error('Error in removeFavoriteFlight:', error);
    throw error;
  }
};

export const getFavoriteFlights = async (db: SQLiteDatabase) => {
  try {
    const result = await db.getAllAsync<FavoriteFlight>(`
      SELECT * FROM favorite_flights 
      ORDER BY 
        completed_at IS NULL DESC,  -- Active flights first (completed_at is NULL)
        completed_at DESC           -- Then most recently completed
    `);
    return result;
  } catch (error) {
    console.error('Error in getFavoriteFlights:', error);
    throw error;
  }
};

export const isFavoriteFlight = async (db: SQLiteDatabase, callsign: string) => {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM favorite_flights WHERE callsign = ?',
      [callsign]
    );
    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error('Error in isFavoriteFlight:', error);
    throw error;
  }
};

export const markFlightAsCompleted = async (
  db: SQLiteDatabase,
  callsign: string,
  completedAt: number,
  flightDuration: number,
  finalFlightData: string
) => {
  try {
    await db.runAsync(
      `UPDATE favorite_flights 
       SET completed_at = ?, 
           flight_duration = ?,
           flight_data = ?
       WHERE callsign = ?`,
      [completedAt, flightDuration, finalFlightData, callsign]
    );
  } catch (error) {
    console.error('Error in markFlightAsCompleted:', error);
    throw error;
  }
};
