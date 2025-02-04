import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { FlightPhase } from '../utils/flightCalculations';

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
}

export default function FavoriteFlightListItem({ flight, liveData, onPress }: FavoriteFlightProps) {
  const isCompleted = flight.completed_at !== null;

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
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : "airplane"} 
            size={20} 
            color={isCompleted ? Colors.primary : Colors.light.tint} 
          />
          <Text style={styles.callsign}>{flight.callsign}</Text>
          <View style={[styles.badge, isCompleted && styles.completedBadge]}>
            <Text style={styles.badgeText}>
              {isCompleted ? 'Completed' : flight.aircraft}
            </Text>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <View style={styles.airportContainer}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.airport}>{flight.departure}</Text>
          </View>
          <View style={styles.separatorContainer}>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.tabIconDefault} />
          </View>
          <View style={styles.airportContainer}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.airport}>{flight.arrival}</Text>
          </View>
        </View>
        {isCompleted && flight.completed_at && flight.flight_duration && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              {`Completed ${formatCompletionTime(flight.completed_at)} • Duration: ${formatDuration(flight.flight_duration)}`}
            </Text>
          </View>
        )}
        {!isCompleted && liveData && (
          <View style={styles.liveDataContainer}>
            <Text style={styles.liveDataText}>
              {[
                liveData.altitude && `${liveData.altitude} ft`,
                liveData.groundspeed && `${liveData.groundspeed} kts`,
                `${Math.floor(liveData.distanceFlown)} / ${Math.floor(liveData.totalDistance)} NM`
              ].filter(Boolean).join(' • ')}
            </Text>
          </View>
        )}
      </View>
      {!isCompleted && <Ionicons name="chevron-forward" size={24} color={Colors.light.tabIconDefault} />}
    </View>
  );

  if (onPress && !isCompleted) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: 'white',
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
}); 