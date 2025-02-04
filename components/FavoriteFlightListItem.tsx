import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '../constants/Colors';
import { FlightPhase } from '../utils/flightCalculations';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useRef } from 'react';


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
}

interface FavoriteFlightProps {
  flight: {
    callsign: string;
    departure: string;
    arrival: string;
    aircraft: string;
    airline_name: string | null;
    completed_at: number | null;
    flight_duration: number | null;
  };
  liveData?: LiveFlightData;
  onPress?: () => void;
  onDelete?: () => void;
}

const RightActions = () => {
  return (
    <View style={styles.deleteContainer}>
      <Ionicons name="trash" size={24} color="white" />
    </View>
  );
};

export default function FavoriteFlightListItem({ flight, liveData, onPress, onDelete }: FavoriteFlightProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const isCompleted = flight.completed_at !== null;

  const handleDelete = () => {
    if (onDelete) {
      swipeableRef.current?.close();
      Alert.alert(
        'Done!',
        'Flight has been removed from your favorites',
        [{ text: 'OK' }]
      );
      onDelete();
    }
  };

  // Format the completion time and duration if the flight is completed
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCompletionTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.callsignContainer}>
          <Text style={styles.callsign}>{flight.callsign}</Text>
          <View style={[styles.badge, isCompleted && styles.completedBadge]}>
            <Text style={[styles.badgeText, isCompleted && styles.completedBadgeText]}>
              {isCompleted ? 'Completed' : flight.aircraft}
            </Text>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <View style={styles.airportContainer}>
            <MaterialCommunityIcons name="airplane-takeoff" size={16} color={Colors.blue} />
            <Text style={styles.airport}>{flight.departure}</Text>
          </View>
          <View style={styles.separatorContainer}>
            <AntDesign name="minus" size={16} color={Colors.light.tabIconDefault} />
          </View>
          <View style={styles.airportContainer}>
            <MaterialCommunityIcons name="airplane-landing" size={16} color={Colors.blue} />
            <Text style={styles.airport}>{flight.arrival}</Text>
          </View>
        </View>
        {isCompleted && flight.completed_at && flight.flight_duration && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              {`Completed ${formatCompletionTime(flight.completed_at)}`}
            </Text>
          </View>
        )}
      </View>
      {!isCompleted && <Ionicons name="chevron-forward" size={24} color={Colors.light.tabIconDefault} />}
    </View>
  );

  const wrappedContent = (
    <Animated.View exiting={FadeOut}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => <RightActions />}
        onSwipeableOpen={handleDelete}
        rightThreshold={40}
      >
        {content}
      </Swipeable>
    </Animated.View>
  );

  if (onPress && !isCompleted) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {wrappedContent}
      </TouchableOpacity>
    );
  }

  return wrappedContent;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
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
  badge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: Colors.greenLight,
  },
  completedBadgeText: {
    color: Colors.green,
    fontSize: 12,
    fontWeight: '500',
  },
  badgeText: {
    color: Colors.blue,
    fontSize: 12,
    fontWeight: '500',
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
  completionContainer: {
    marginTop: 8,
  },
  completionText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  liveDataContainer: {
    marginTop: 8,
  },
  liveDataText: {
    fontSize: 12,
    color: Colors.light.tint,
  },
  separatorContainer: {
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteContainer: {
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
}); 