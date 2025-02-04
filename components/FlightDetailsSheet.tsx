import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Text } from './Themed';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { FlightPhase } from '../utils/flightCalculations';
import FlightStatus from './FlightStatus';
import { airports } from '../utils/airports';
import { addFavoriteFlight, removeFavoriteFlight, isFavoriteFlight } from '../utils/Database';
import { useDatabase } from '../utils/DatabaseContext';

interface FlightDetailsProps {
  flight: {
    callsign: string;
    departure: string;
    arrival: string;
    departureAirportName?: string;
    arrivalAirportName?: string;
    aircraft: string;
    progress?: number;
    altitude?: string;
    groundspeed?: string;
    heading?: string;
    status?: string;
    phase: FlightPhase;
    distanceFlown: number;
    totalDistance: number;
    airlineName?: string;
    completedAt?: number;
    flightDuration?: number;
  };
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  lastUpdate: Date;
}

export default function FlightDetailsSheet({ flight, bottomSheetRef, lastUpdate }: FlightDetailsProps) {
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const progressAnimation = useMemo(() => new Animated.Value(flight.progress || 0), []);
  const distanceFlownAnimation = useMemo(() => new Animated.Value(0), []);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const db = useDatabase();

  // Check if flight is completed
  const isFlightCompleted = flight.phase === FlightPhase.ARRIVED || flight.completedAt != null;

  // Load favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const favorited = await isFavoriteFlight(db, flight.callsign);
      setIsFavorite(favorited);
    };
    checkFavoriteStatus();
  }, [flight.callsign]);

  const handleFavoritePress = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isFavorite) {
        await removeFavoriteFlight(db, flight.callsign);
        setIsFavorite(false);
      } else {
        await addFavoriteFlight(db, {
          callsign: flight.callsign,
          departure: flight.departure,
          arrival: flight.arrival,
          aircraft: flight.aircraft,
          airline_name: flight.airlineName || null,
          favorited_at: Date.now(),
          completed_at: null,
          flight_duration: null,
          flight_data: JSON.stringify({
            phase: flight.phase,
            progress: flight.progress,
            distanceFlown: flight.distanceFlown,
            totalDistance: flight.totalDistance
          })
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Animate progress
    Animated.spring(progressAnimation, {
      toValue: flight.progress || 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();

    // Animate distance with safe values
    const safeDistanceFlown = Math.max(0, Math.round(flight.distanceFlown));
    Animated.spring(distanceFlownAnimation, {
      toValue: safeDistanceFlown,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [flight.progress, flight.distanceFlown]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const formatLastUpdate = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds <= 5) {
      return 'Just now';
    } else {
      return `${seconds}s ago`;
    }
  }, []);

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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backgroundStyle={styles.bottomSheetBackground}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="airplane" size={24} color={Colors.light.tint} />
            <View style={styles.callsignContainer}>
              <View style={styles.callsignRow}>
                <Text style={styles.callsign}>{flight.callsign}</Text>
                <View style={styles.aircraftBadge}>
                  <Text style={styles.aircraftText}>{flight.aircraft}</Text>
                </View>
              </View>
              {flight.airlineName && flight.airlineName.length > 0 && (
                <Text style={styles.airlineName}>{flight.airlineName}</Text>
              )}
            </View>
          </View>
          {!isFlightCompleted && (
            <Text style={styles.lastUpdate}>{formatLastUpdate(lastUpdate)}</Text>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <View style={styles.airportCodeContainer}>
              <Ionicons name="arrow-up-circle" size={20} color={Colors.light.tint} />
              <Text style={styles.airport}>{flight.departure}</Text>
            </View>
            <FlightStatus phase={flight.phase} />
            <View style={[styles.airportCodeContainer, styles.rightAligned]}>
              <Ionicons name="arrow-down-circle" size={20} color={Colors.light.tint} />
              <Text style={styles.airport}>{flight.arrival}</Text>
            </View>
          </View>
          <View style={styles.airportLabelsContainer}>
            <View style={styles.airportLabelLeft}>
              <Text style={styles.airportName} numberOfLines={1} ellipsizeMode="tail">
                {airports[flight.departure]?.name || 'Departure airport'}
              </Text>
            </View>
            <View style={styles.airportLabelRight}>
              <Text style={styles.airportName} numberOfLines={1} ellipsizeMode="tail">
                {airports[flight.arrival]?.name || 'Arrival airport'}
              </Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.airplaneIndicator,
                  {
                    left: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]}
              >
                <Ionicons 
                  name="airplane" 
                  size={20} 
                  color={Colors.light.tint}
                  style={{ transform: [{ rotate: '0deg' }] }}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Flight Details */}
        <View style={styles.detailsContainer}>
          {!isFlightCompleted && flight.altitude && (
            <View style={styles.detailItem}>
              <Ionicons name="trending-up" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Altitude</Text>
              <Text style={styles.detailValue}>{flight.altitude} ft</Text>
            </View>
          )}
          {!isFlightCompleted && flight.groundspeed && (
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Ground Speed</Text>
              <Text style={styles.detailValue}>{flight.groundspeed} kts</Text>
            </View>
          )}
          {!isFlightCompleted && flight.heading && (
            <View style={styles.detailItem}>
              <Ionicons name="compass" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Heading</Text>
              <Text style={styles.detailValue}>{flight.heading}°</Text>
            </View>
          )}
          {isFlightCompleted && flight.completedAt && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Completed</Text>
              <Text style={styles.detailValue}>{formatCompletionTime(flight.completedAt)}</Text>
            </View>
          )}
          {isFlightCompleted && flight.flightDuration && (
            <View style={styles.detailItem}>
              <Ionicons name="timer" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{formatDuration(flight.flightDuration)}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={20} color={Colors.light.tint} />
            <Text style={styles.detailLabel}>Distance Flown</Text>
            <Text style={styles.detailValue}>
              {Math.floor(flight.distanceFlown)} NM
            </Text>
          </View>
          {!isFlightCompleted && (
            <View style={styles.detailItem}>
              <Ionicons name="flag-outline" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Distance Remaining</Text>
              <Text style={styles.detailValue}>
                {Math.floor(flight.totalDistance - flight.distanceFlown)} NM
              </Text>
            </View>
          )}
          {!isFlightCompleted && flight.status && (
            <View style={styles.detailItem}>
              <Ionicons name="information-circle" size={20} color={Colors.light.tint} />
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{flight.status}</Text>
            </View>
          )}
        </View>

        {/* Add favorite button at the bottom */}
        <View style={styles.favoriteButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.favoriteButton,
              isFlightCompleted && styles.disabledButton,
              isFavorite && styles.unfavoriteButton
            ]}
            onPress={handleFavoritePress}
            disabled={isFlightCompleted || isLoading}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color="white" 
              style={styles.favoriteIcon}
            />
            <Text style={styles.favoriteButtonText}>
              {isFlightCompleted 
                ? "Flight Completed" 
                : isFavorite 
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: Colors.light.background,
  },
  handleIndicator: {
    backgroundColor: Colors.light.border,
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callsignContainer: {
    marginLeft: 12,
  },
  callsignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  callsign: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  airlineName: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  aircraftBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aircraftText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    alignSelf: 'flex-start',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  airportCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightAligned: {
    justifyContent: 'flex-end',
  },
  airport: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  airportLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  airportLabelLeft: {
    flex: 1,
    paddingRight: 8,
  },
  airportLabelRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  airportName: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  airplaneIndicator: {
    position: 'absolute',
    top: -8,
    transform: [{ translateX: -10 }],
  },
  detailsContainer: {
    marginTop: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  favoriteButtonContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  favoriteButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfavoriteButton: {
    backgroundColor: Colors.pink,
  },
  disabledButton: {
    backgroundColor: Colors.light.tabIconDefault,
    opacity: 0.7,
  },
  favoriteIcon: {
    marginRight: 8,
  },
  favoriteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 