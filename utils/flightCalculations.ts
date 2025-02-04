import { airports, Airport } from './airports';

interface Coordinates {
  lat: number;
  lng: number;
}

interface FlightProgress {
  progress: number;        // 0-100
  distanceFlown: number;   // in nautical miles
  totalDistance: number;   // in nautical miles
  currentPhase: FlightPhase;
}

export enum FlightPhase {
  DEPARTING = 'Departing',
  DEPARTED = 'Departed',
  CLIMBING = 'Climbing',
  CRUISING = 'Cruising',
  DESCENDING = 'Descending',
  ARRIVING = 'Arriving',
  ARRIVED = 'Arrived',
  UNKNOWN = 'Unknown'
}

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Calculate great circle distance between two points
const calculateGreatCircleDistance = (start: Coordinates, end: Coordinates): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
           Math.cos(lat1) * Math.cos(lat2) *
           Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate vertical rate in ft/min
const calculateVerticalRate = (
  currentAltitude: number,
  previousAltitude: number,
  currentTime: Date,
  previousTime: Date
): number => {
  const timeDiffMinutes = (currentTime.getTime() - previousTime.getTime()) / (1000 * 60);
  if (timeDiffMinutes === 0) return 0;
  return (currentAltitude - previousAltitude) / timeDiffMinutes;
};

// Determine flight phase based on new specifications
const determineFlightPhase = (
  currentPosition: Coordinates,
  departureAirport: Airport,
  arrivalAirport: Airport,
  altitude: number,
  groundspeed: number,
  distanceFromDeparture: number,
  distanceToArrival: number,
  previousAltitude?: number,
  previousAltitudeTimestamp?: Date,
  currentTime?: Date,
  cruisingLevel?: number
): FlightPhase => {
  // Convert altitude to feet if it's in another unit
  const altFt = altitude;
  const verticalRate = previousAltitude && previousAltitudeTimestamp && currentTime
    ? calculateVerticalRate(altFt, previousAltitude, currentTime, previousAltitudeTimestamp)
    : 0;

  // Convert distances to km (1 NM = 1.852 km)
  const distanceFromDepartureKm = distanceFromDeparture * 1.852;
  const distanceToArrivalKm = distanceToArrival * 1.852;

  // Calculate altitude AGL for both airports
  const altitudeAGLDep = altFt - departureAirport.elevation;
  const altitudeAGLArr = altFt - arrivalAirport.elevation;

  // Determine if we're closer to departure or arrival
  const closerToDeparture = distanceFromDepartureKm < distanceToArrivalKm;

  // Get effective cruise level, defaulting to 30000 if not provided or invalid
  const effectiveCruiseLevel = (cruisingLevel && cruisingLevel > 0) ? cruisingLevel : 30000;

  // DEPARTING: On ground or about to take off at departure airport
  if (
    closerToDeparture &&
    distanceFromDepartureKm <= 3 && // Within 3km radius (more lenient)
    altitudeAGLDep < 1000 && // Below 1000ft AGL
    groundspeed <= 60 // Ground speed 0-60 knots (more lenient)
  ) {
    return FlightPhase.DEPARTING;
  }

  // DEPARTED: Initial climb after takeoff
  if (
    closerToDeparture &&
    distanceFromDepartureKm <= 50 && // Within 50km from departure
    altitudeAGLDep > 500 && // Above 500ft AGL (more lenient)
    (verticalRate > 200 || altitudeAGLDep < 5000) && // Climbing or still low
    groundspeed > 80 // Speed > 80 knots (more lenient)
  ) {
    return FlightPhase.DEPARTED;
  }

  // CLIMBING: Main climb phase
  if (
    closerToDeparture &&
    distanceFromDepartureKm > 10 && // >10km from departure (more lenient)
    altFt < (effectiveCruiseLevel * 0.95) && // Below cruise level
    ((verticalRate > 200) || // Climbing
     (altFt < effectiveCruiseLevel * 0.8)) && // Or still well below cruise
    groundspeed > 120 // Speed > 120 knots (more lenient)
  ) {
    return FlightPhase.CLIMBING;
  }

  // CRUISING: At or near cruise altitude
  if (
    distanceFromDepartureKm > 30 && // Further from departure
    distanceToArrivalKm > 50 && // Not too close to arrival
    ((Math.abs(verticalRate) <= 500) || // Level flight
     (Math.abs(altFt - effectiveCruiseLevel) <= 2500)) && // Or near cruise altitude
    groundspeed > 150 && // Reasonable cruise speed (more lenient)
    altFt > 10000 // Above transition altitude
  ) {
    return FlightPhase.CRUISING;
  }

  // DESCENDING: Initial descent phase
  if (
    !closerToDeparture && // Closer to arrival
    distanceToArrivalKm <= 200 && // Within 200km of destination
    ((verticalRate < -200) || // Descending
     (altFt < effectiveCruiseLevel * 0.8)) && // Or below cruise level
    altitudeAGLArr > 3000 && // Still well above airport
    groundspeed > 120 // Maintaining reasonable speed
  ) {
    return FlightPhase.DESCENDING;
  }

  // ARRIVING: Final approach phase
  if (
    !closerToDeparture && // Closer to arrival
    distanceToArrivalKm <= 50 && // Within 50km of destination
    ((verticalRate < -100) || // Descending (more lenient)
     (altitudeAGLArr < 10000)) && // Or below 10000ft AGL
    altitudeAGLArr > 100 && // Still above ground
    groundspeed < 250 // Speed reducing (more lenient)
  ) {
    return FlightPhase.ARRIVING;
  }

  // ARRIVED: On ground at destination
  if (
    !closerToDeparture &&
    distanceToArrivalKm <= 3 && // At destination airport (more lenient)
    altitudeAGLArr < 1000 && // Below 1000ft AGL
    groundspeed <= 60 // Ground speed 0-60 knots (more lenient)
  ) {
    return FlightPhase.ARRIVED;
  }

  return FlightPhase.UNKNOWN;
};

export const calculateFlightProgress = (
  departureIcao: string,
  arrivalIcao: string,
  currentPosition: Coordinates,
  altitude: number,
  groundspeed: number,
  previousAltitude?: number,
  previousAltitudeTimestamp?: Date,
  currentTime?: Date,
  cruisingLevel?: number
): FlightProgress | null => {
  // Get airport data
  const departureAirport = airports[departureIcao];
  const arrivalAirport = airports[arrivalIcao];

  // Return null if we don't have the airport data
  if (!departureAirport || !arrivalAirport) {
    return null;
  }

  // Calculate distances
  const totalDistance = calculateGreatCircleDistance(
    { lat: departureAirport.lat, lng: departureAirport.lng },
    { lat: arrivalAirport.lat, lng: arrivalAirport.lng }
  );

  const distanceFlown = calculateGreatCircleDistance(
    { lat: departureAirport.lat, lng: departureAirport.lng },
    currentPosition
  );

  const distanceToArrival = calculateGreatCircleDistance(
    currentPosition,
    { lat: arrivalAirport.lat, lng: arrivalAirport.lng }
  );

  // Calculate progress percentage
  const progress = Math.min(100, Math.max(0, (distanceFlown / totalDistance) * 100));

  // Determine flight phase
  const currentPhase = determineFlightPhase(
    currentPosition,
    departureAirport,
    arrivalAirport,
    altitude,
    groundspeed,
    distanceFlown,
    distanceToArrival,
    previousAltitude,
    previousAltitudeTimestamp,
    currentTime,
    cruisingLevel
  );

  return {
    progress,
    distanceFlown,
    totalDistance,
    currentPhase
  };
};

// Get color for flight phase
export const getFlightPhaseColor = (phase: FlightPhase): string => {
  switch (phase) {
    case FlightPhase.DEPARTING:
      return '#FFA500'; // Orange
    case FlightPhase.DEPARTED:
      return '#FF6B6B'; // Coral
    case FlightPhase.CLIMBING:
      return '#4CAF50'; // Green
    case FlightPhase.CRUISING:
      return '#2196F3'; // Blue
    case FlightPhase.DESCENDING:
      return '#9C27B0'; // Purple
    case FlightPhase.ARRIVING:
      return '#FF9800'; // Dark Orange
    case FlightPhase.ARRIVED:
      return '#4CAF50'; // Green
    default:
      return '#757575'; // Gray
  }
}; 