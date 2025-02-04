import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Themed';
import { FlightPhase, getFlightPhaseColor } from '../utils/flightCalculations';

interface FlightStatusProps {
  phase: FlightPhase;
}

export default function FlightStatus({ phase }: FlightStatusProps) {
  const backgroundColor = getFlightPhaseColor(phase);

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={styles.phaseText}>{phase}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  phaseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 