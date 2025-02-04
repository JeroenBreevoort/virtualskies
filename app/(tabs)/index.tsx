import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, TextInput, RefreshControl } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Text } from '../../components/Themed';
import FlightListItem from '../../components/FlightListItem';
import FlightDetailsSheet from '../../components/FlightDetailsSheet';
import Colors from '../../constants/Colors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { airlines } from '../../utils/airlines';
import { calculateFlightProgress, FlightPhase } from '../../utils/flightCalculations';
import * as SQLite from 'expo-sqlite';
import { isFavoriteFlight } from '../../utils/Database';

const UPDATE_INTERVAL = 15000; // 15 seconds

interface Flight {
  callsign: string;
  departure: string;
  arrival: string;
  aircraft: string;
  progress: number;
  altitude: string;
  groundspeed: string;
  heading: string;
  status: string;
  phase: FlightPhase;
  distanceFlown: number;
  totalDistance: number;
  airlineName?: string;
  lastUpdate: Date;
  previousAltitude?: number;
  previousAltitudeTimestamp?: Date;
  cruisingLevel?: number;
}

export default function FlightsScreen() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const db = SQLite.openDatabaseSync('flights.db');

  const handlePresentModalPress = useCallback((flight: Flight) => {
    setSelectedFlight(flight);
    bottomSheetRef.current?.present();
  }, []);

  const getAirlineName = (callsign: string) => {
    const airlineCode = callsign.slice(0, 3);
    return airlines[airlineCode] || '';
  };

  // Update selected flight when new data arrives
  useEffect(() => {
    if (selectedFlight) {
      const updatedFlight = flights.find(f => f.callsign === selectedFlight.callsign);
      if (updatedFlight) {
        setSelectedFlight(updatedFlight);
      }
    }
  }, [flights]);

  // Interpolate progress between updates for smooth animation
  const interpolateProgress = useCallback((currentFlights: Flight[]) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const interpolationStep = 1000; // Update every second
    const steps = 15000 / interpolationStep; // 15 seconds total
    let currentStep = 0;

    progressInterval.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        return;
      }

      setFlights(prevFlights => {
        const newFlights = prevFlights.map(flight => {
          const currentFlight = currentFlights.find(f => f.callsign === flight.callsign);
          if (!currentFlight) return flight;

          const progressDiff = currentFlight.progress - flight.progress;
          const stepProgress = progressDiff / steps;
          
          return {
            ...flight,
            progress: flight.progress + (stepProgress * currentStep)
          };
        });

        // Also update selected flight if it exists
        if (selectedFlight) {
          const updatedSelectedFlight = newFlights.find(f => f.callsign === selectedFlight.callsign);
          if (updatedSelectedFlight) {
            setSelectedFlight(updatedSelectedFlight);
          }
        }

        return newFlights;
      });
    }, interpolationStep);
  }, [selectedFlight]);

  const fetchFlights = async () => {
    try {
      const response = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
      const data = await response.json();
      const currentTime = new Date();
      
      const newFlights = data.pilots.map((pilot: any) => {
        // Find existing flight to get previous values
        const existingFlight = flights.find(f => f.callsign === pilot.callsign);
        
        const flightProgress = calculateFlightProgress(
          pilot.flight_plan?.departure || '',
          pilot.flight_plan?.arrival || '',
          { 
            lat: pilot.latitude, 
            lng: pilot.longitude 
          },
          parseFloat(pilot.altitude) || 0,
          parseFloat(pilot.groundspeed) || 0,
          existingFlight?.previousAltitude,
          existingFlight?.previousAltitudeTimestamp,
          currentTime,
          parseFloat(pilot.flight_plan?.altitude) || 0
        );
        
        return {
          callsign: pilot.callsign,
          departure: pilot.flight_plan?.departure || 'N/A',
          arrival: pilot.flight_plan?.arrival || 'N/A',
          aircraft: pilot.flight_plan?.aircraft_short || 'N/A',
          progress: flightProgress?.progress || 0,
          altitude: pilot.altitude?.toString() || 'N/A',
          groundspeed: pilot.groundspeed?.toString() || 'N/A',
          heading: pilot.heading?.toString() || 'N/A',
          status: pilot.flight_plan?.status || 'N/A',
          phase: flightProgress?.currentPhase || FlightPhase.UNKNOWN,
          distanceFlown: flightProgress?.distanceFlown || 0,
          totalDistance: flightProgress?.totalDistance || 0,
          airlineName: getAirlineName(pilot.callsign),
          lastUpdate: currentTime,
          previousAltitude: parseFloat(pilot.altitude) || 0,
          previousAltitudeTimestamp: currentTime,
          cruisingLevel: parseFloat(pilot.flight_plan?.altitude) || 0
        };
      });

      setFlights(newFlights);
      setLastUpdateTime(currentTime);
      interpolateProgress(newFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 15000); // Update every 15 seconds
    
    return () => {
      clearInterval(interval);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const filteredFlights = flights.filter(flight => 
    flight.callsign.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFlights();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search by callsign"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
              clearButtonMode="while-editing"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              placeholderTextColor={Colors.light.tabIconDefault}
            />
          </View>
          <FlatList
            data={filteredFlights}
            renderItem={({ item }) => (
              <Pressable onPress={() => handlePresentModalPress(item)}>
                <FlightListItem flight={item} />
              </Pressable>
            )}
            keyExtractor={(item) => item.callsign}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.light.tint}
              />
            }
          />
          {selectedFlight && (
            <FlightDetailsSheet
              flight={{
                callsign: selectedFlight.callsign,
                departure: selectedFlight.departure,
                arrival: selectedFlight.arrival,
                aircraft: selectedFlight.aircraft,
                progress: selectedFlight.progress,
                altitude: selectedFlight.altitude,
                groundspeed: selectedFlight.groundspeed,
                heading: selectedFlight.heading,
                status: selectedFlight.status,
                phase: selectedFlight.phase,
                distanceFlown: selectedFlight.distanceFlown,
                totalDistance: selectedFlight.totalDistance,
                airlineName: selectedFlight.airlineName,
              }}
              bottomSheetRef={bottomSheetRef}
              lastUpdate={lastUpdateTime}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  searchBar: {
    height: 36,
    backgroundColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
}); 