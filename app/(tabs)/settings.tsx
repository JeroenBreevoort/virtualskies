import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from '../../components/Themed';
import Colors from '../../constants/Colors';
import { useDatabase } from '../../utils/DatabaseContext';
import { getFavoriteFlights, markFlightAsCompleted, removeFavoriteFlight } from '../../utils/Database';
import { useCallback, useEffect, useRef, useState } from 'react';
import FavoriteFlightListItem from '../../components/FavoriteFlightListItem';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import FlightDetailsSheet from '../../components/FlightDetailsSheet';
import { FlightPhase, calculateFlightProgress } from '../../utils/flightCalculations';
import { airlines } from '../../utils/airlines';
import { NotificationService } from '../../utils/NotificationService';
import { NotificationTest } from '../../components/NotificationTest';
import { FavoriteFlight as SupabaseFavoriteFlight } from '../../utils/FavoriteFlightsService';

const UPDATE_INTERVAL = 15000; // 15 seconds
const INTERPOLATION_STEP = 1000; // 1 second
const TIME_UPDATE_INTERVAL = 1000; // 1 second

interface FavoriteFlight {
  callsign: string;
  departure: string;
  arrival: string;
  aircraft: string;
  airline_name: string | null;
  completed_at: number | null;
  flight_duration: number | null;
  flight_data: string | null;
  favorited_at: number;  // Keep as number for SQLite
}

interface LiveFlightData {
  altitude?: string;
  groundspeed?: string;
  heading?: string;
  status?: string;
  phase: FlightPhase;
  progress: number;
  distanceFlown: number;
  totalDistance: number;
  latitude: number;
  longitude: number;
  lastUpdate: Date;
  arrivedAt?: number;
}

interface SelectedFlight {
  callsign: string;
  departure: string;
  arrival: string;
  departureAirportName?: string;
  arrivalAirportName?: string;
  aircraft: string;
  airlineName?: string;
  phase: FlightPhase;
  progress: number;
  distanceFlown: number;
  totalDistance: number;
  altitude?: string;
  groundspeed?: string;
  heading?: string;
  status?: string;
  completedAt?: number;
  flightDuration?: number;
}

export default function SettingsScreen() {
  const [favorites, setFavorites] = useState<FavoriteFlight[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [liveFlightData, setLiveFlightData] = useState<Record<string, LiveFlightData>>({});
  const db = useDatabase();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await getFavoriteFlights(db);
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [db]);

  // Interpolate progress between updates for smooth animation
  const interpolateProgress = useCallback((currentLiveData: Record<string, LiveFlightData>) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const steps = UPDATE_INTERVAL / INTERPOLATION_STEP;
    let currentStep = 0;

    progressInterval.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        return;
      }

      setLiveFlightData(prevData => {
        const newData: Record<string, LiveFlightData> = {};
        
        Object.keys(prevData).forEach(callsign => {
          const currentFlight = currentLiveData[callsign];
          const prevFlight = prevData[callsign];
          
          if (!currentFlight || !prevFlight) {
            newData[callsign] = prevFlight;
            return;
          }

          const progressDiff = currentFlight.progress - prevFlight.progress;
          const stepProgress = progressDiff / steps;
          const distanceDiff = currentFlight.distanceFlown - prevFlight.distanceFlown;
          const stepDistance = distanceDiff / steps;

          newData[callsign] = {
            ...prevFlight,
            progress: prevFlight.progress + (stepProgress * currentStep),
            distanceFlown: prevFlight.distanceFlown + (stepDistance * currentStep)
          };
        });

        // Update selected flight if it exists and is active
        if (selectedFlight && !selectedFlight.completedAt) {
          const updatedFlightData = newData[selectedFlight.callsign];
          if (updatedFlightData) {
            setSelectedFlight(prev => ({
              ...(prev as SelectedFlight),
              ...updatedFlightData
            }));
          }
        }

        return newData;
      });
    }, INTERPOLATION_STEP);
  }, [selectedFlight]);

  const fetchLiveFlightData = useCallback(async () => {
    try {
      const response = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
      const data = await response.json();
      const currentTime = new Date();
      const newLiveData: Record<string, LiveFlightData> = {};
      const completedFlights: string[] = [];

      // Process pilots data
      for (const pilot of data.pilots) {
        const callsign = pilot.callsign;
        const favorite = favorites.find(f => f.callsign === callsign);
        
        if (favorite && !favorite.completed_at) {
          const flightProgress = calculateFlightProgress(
            pilot.flight_plan?.departure || '',
            pilot.flight_plan?.arrival || '',
            { lat: pilot.latitude, lng: pilot.longitude },
            parseFloat(pilot.altitude),
            parseFloat(pilot.groundspeed),
            undefined,
            undefined,
            currentTime
          );

          if (flightProgress) {
            const liveData: LiveFlightData = {
              altitude: pilot.altitude,
              groundspeed: pilot.groundspeed,
              heading: pilot.heading,
              status: pilot.flight_plan?.status || '',
              phase: flightProgress.currentPhase,
              progress: flightProgress.progress,
              distanceFlown: flightProgress.distanceFlown,
              totalDistance: flightProgress.totalDistance,
              latitude: pilot.latitude,
              longitude: pilot.longitude,
              lastUpdate: currentTime
            };

            newLiveData[callsign] = liveData;

            // Check if flight just completed
            if (flightProgress.currentPhase === FlightPhase.ARRIVED && !favorite.completed_at) {
              completedFlights.push(callsign);
              
              // Convert favorited_at ISO string to milliseconds for duration calculation
              const flightDuration = Math.floor((currentTime.getTime() - new Date(favorite.favorited_at).getTime()) / 1000);
              await markFlightAsCompleted(
                db,
                callsign,
                currentTime.getTime(),
                flightDuration,
                JSON.stringify(liveData)
              );
              
              // Send notification for completed flight
              await NotificationService.scheduleFlightCompletionNotification(callsign);
            }
          }
        }
      }

      // If the selected flight was completed, update its state
      if (selectedFlight && completedFlights.includes(selectedFlight.callsign)) {
        const completedFlight = favorites.find(f => f.callsign === selectedFlight.callsign);
        if (completedFlight) {
          const lastKnownData = liveFlightData[selectedFlight.callsign];
          setSelectedFlight(prev => ({
            ...selectedFlight,
            phase: FlightPhase.ARRIVED,
            progress: 100,
            completedAt: currentTime.getTime(),
            flightDuration: Math.floor((currentTime.getTime() - lastKnownData.lastUpdate.getTime()) / 1000)
          }));
        }
      }

      setLiveFlightData(newLiveData);
      setLastUpdateTime(currentTime);

      // Start progress interpolation with new data
      interpolateProgress(newLiveData);

      // Update selected flight if it exists and is active
      if (selectedFlight && !selectedFlight.completedAt && !completedFlights.includes(selectedFlight.callsign)) {
        const updatedFlightData = newLiveData[selectedFlight.callsign];
        if (updatedFlightData) {
          setSelectedFlight(prev => ({
            ...(prev as SelectedFlight),
            ...updatedFlightData
          }));
        }
      }

      // Reload favorites to get updated completion status
      if (completedFlights.length > 0) {
        loadFavorites();
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  }, [favorites, db, loadFavorites, liveFlightData, selectedFlight]);

  // Update time display every second when showing an active flight
  useEffect(() => {
    if (selectedFlight && !selectedFlight.completedAt) {
      // Initial update
      setLastUpdateTime(new Date());
      
      // Set up interval for updates
      timeUpdateInterval.current = setInterval(() => {
        setLastUpdateTime(new Date());
      }, TIME_UPDATE_INTERVAL);

      return () => {
        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current);
          timeUpdateInterval.current = null;
        }
      };
    }
  }, [selectedFlight]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (favorites.some(f => !f.completed_at)) {
      fetchLiveFlightData();
      updateInterval.current = setInterval(fetchLiveFlightData, UPDATE_INTERVAL);

      return () => {
        if (updateInterval.current) {
          clearInterval(updateInterval.current);
          updateInterval.current = null;
        }
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current);
          timeUpdateInterval.current = null;
        }
      };
    }
  }, [favorites, fetchLiveFlightData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFavorites(), fetchLiveFlightData()]);
    setRefreshing(false);
  }, [loadFavorites, fetchLiveFlightData]);

  const handleFlightPress = useCallback((flight: FavoriteFlight) => {
    if (flight.completed_at) {
      // For completed flights, use the stored flight data
      const flightData = flight.flight_data ? JSON.parse(flight.flight_data) : null;
      setSelectedFlight({
        callsign: flight.callsign,
        departure: flight.departure,
        arrival: flight.arrival,
        aircraft: flight.aircraft,
        airlineName: flight.airline_name || undefined,
        phase: FlightPhase.ARRIVED,
        progress: 100,
        distanceFlown: flightData?.distanceFlown || flightData?.totalDistance || 0,
        totalDistance: flightData?.totalDistance || 0,
        altitude: flightData?.lastKnownAltitude,
        groundspeed: flightData?.lastKnownGroundspeed,
        heading: flightData?.lastKnownHeading,
        status: flightData?.lastKnownStatus || 'Completed',
        completedAt: flight.completed_at || undefined,
        flightDuration: flight.flight_duration || undefined
      });
    } else {
      // For active flights, use the live data
      const liveData = liveFlightData[flight.callsign];
      if (liveData) {
        setSelectedFlight({
          callsign: flight.callsign,
          departure: flight.departure,
          arrival: flight.arrival,
          aircraft: flight.aircraft,
          airlineName: flight.airline_name || undefined,
          phase: liveData.phase,
          progress: liveData.progress,
          distanceFlown: liveData.distanceFlown,
          totalDistance: liveData.totalDistance,
          altitude: liveData.altitude,
          groundspeed: liveData.groundspeed,
          heading: liveData.heading,
          status: liveData.status
        });
      }
    }
    bottomSheetRef.current?.present();
  }, [liveFlightData]);

  const handleDelete = useCallback(async (callsign: string) => {
    try {
      await removeFavoriteFlight(db, callsign);
      await loadFavorites();
    } catch (error) {
      console.error('Error removing favorite flight:', error);
    }
  }, [db, loadFavorites]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Favorite Flights</Text>
      <Text style={styles.subtitle}>
        {favorites.length} {favorites.length === 1 ? 'flight' : 'flights'} saved
      </Text>
    </View>
  ), [favorites.length]);

  return (
    <View style={styles.container}>
      <NotificationTest />
      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <FavoriteFlightListItem 
            flight={item}
            onPress={() => handleFlightPress(item)}
            onDelete={() => handleDelete(item.callsign)}
            liveData={!item.completed_at ? liveFlightData[item.callsign] : undefined}
          />
        )}
        keyExtractor={item => item.callsign}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      {selectedFlight && (
        <FlightDetailsSheet
          flight={selectedFlight}
          bottomSheetRef={bottomSheetRef}
          lastUpdate={lastUpdateTime}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  listContent: {
    flexGrow: 1,
  }
}); 