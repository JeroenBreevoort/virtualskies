import { View, StyleSheet, Alert } from 'react-native';
import { Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useRef } from 'react';
import { addFavoriteFlight } from '../utils/Database';
import { useDatabase } from '../utils/DatabaseContext';
import { FlightPhase } from '../utils/flightCalculations';

interface FlightProps {
  flight: {
    callsign: string;
    departure: string;
    arrival: string;
    aircraft: string;
    airlineName?: string;
    phase?: FlightPhase;
    progress?: number;
    distanceFlown?: number;
    totalDistance?: number;
  };
  onFavorite?: () => void;
}

const LeftActions = () => {
  return (
    <View style={styles.favoriteContainer}>
      <Ionicons name="heart" size={24} color="white" />
    </View>
  );
};

export default function FlightListItem({ flight, onFavorite }: FlightProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const db = useDatabase();

  const handleFavorite = async () => {
    if (onFavorite) {
      swipeableRef.current?.close();
      try {
        await addFavoriteFlight(db, {
          callsign: flight.callsign,
          departure: flight.departure,
          arrival: flight.arrival,
          aircraft: flight.aircraft,
          airline_name: flight.airlineName || null,
          favorited_at: Date.now(),
          completed_at: null,
          flight_duration: null,
          flight_data: flight.phase ? JSON.stringify({
            phase: flight.phase,
            progress: flight.progress,
            distanceFlown: flight.distanceFlown,
            totalDistance: flight.totalDistance
          }) : null
        });

        Alert.alert(
          'Whoop!',
          'Flight has been added to your favorites',
          [{ text: 'OK' }]
        );

        onFavorite();
      } catch (error) {
        console.error('Error adding favorite:', error);
      }
    }
  };

  const content = (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.leftContent}>
        <View style={styles.callsignContainer}>
          <Text style={styles.callsign}>{flight.callsign}</Text>
          <View style={styles.aircraftBadge}>
            <Text style={styles.aircraftText}>{flight.aircraft}</Text>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <View style={styles.airportContainer}>
            <MaterialCommunityIcons name="airplane-takeoff" size={16} color={Colors.blue} />
            <Text style={styles.airport}>{flight.departure}</Text>
          </View>
          <AntDesign name="minus" size={16} marginHorizontal={4} color={Colors.light.tabIconDefault} />
          <View style={styles.airportContainer}>
            <MaterialCommunityIcons name="airplane-landing" size={16} color={Colors.blue} />
            <Text style={styles.airport}>{flight.arrival}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.light.tabIconDefault} />
    </View>
  );

  return (
    <Animated.View exiting={FadeOut}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={() => <LeftActions />}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            handleFavorite();
          }
        }}
        leftThreshold={40}
      >
        {content}
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
  },
  leftContent: {
    flex: 1,
  },
  callsignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  callsign: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aircraftBadge: {
    backgroundColor: Colors.blueLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  aircraftText: {
    color: Colors.blue,
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  airport: {
    fontSize: 14,
    marginLeft: 4,
  },
  favoriteContainer: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
}); 