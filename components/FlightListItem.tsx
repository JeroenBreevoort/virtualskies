import { View, StyleSheet } from 'react-native';
import { Text } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface FlightProps {
  flight: {
    callsign: string;
    departure: string;
    arrival: string;
    aircraft: string;
    airlineName?: string;
  };
}

export default function FlightListItem({ flight }: FlightProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.leftContent}>
        <View style={styles.callsignContainer}>
          <Ionicons name="airplane" size={20} color={Colors.light.tint} />
          <Text style={styles.callsign}>{flight.callsign}</Text>
          <View style={styles.aircraftBadge}>
            <Text style={styles.aircraftText}>{flight.aircraft}</Text>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <View style={styles.airportContainer}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.airport}>{flight.departure}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={Colors.light.tabIconDefault} />
          <View style={styles.airportContainer}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.airport}>{flight.arrival}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.light.tabIconDefault} />
    </View>
  );
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
  aircraftBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  aircraftText: {
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
}); 