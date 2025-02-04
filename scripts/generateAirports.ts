import fs from 'fs';
import https from 'https';
import { parse } from 'csv-parse';

interface RawAirport {
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  gps_code: string;
  iata_code: string;
  local_code: string;
}

interface ProcessedAirport {
  icao: string;
  iata: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  country: string;
}

const AIRPORTS_URL = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv';
const OUTPUT_FILE = './utils/airports.ts';

// Only include major airports (large_airport) and those with IATA codes
const processAirports = (airports: RawAirport[]): Record<string, ProcessedAirport> => {
  const processed: Record<string, ProcessedAirport> = {};

  airports.forEach(airport => {
    if (
      airport.type === 'large_airport' && 
      airport.scheduled_service === 'yes' &&
      airport.iata_code &&
      airport.gps_code // This is typically the ICAO code
    ) {
      processed[airport.gps_code] = {
        icao: airport.gps_code,
        iata: airport.iata_code,
        name: airport.name,
        lat: parseFloat(airport.latitude_deg),
        lng: parseFloat(airport.longitude_deg),
        elevation: Math.round(parseFloat(airport.elevation_ft)),
        country: airport.iso_country,
      };
    }
  });

  return processed;
};

const generateTypeScriptFile = (airports: Record<string, ProcessedAirport>) => {
  const fileContent = `// Auto-generated from OurAirports data
// Generated on: ${new Date().toISOString()}

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  country: string;
}

export const airports: Record<string, Airport> = ${JSON.stringify(airports, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`Generated airports database with ${Object.keys(airports).length} airports`);
};

// Download and process the data
https.get(AIRPORTS_URL, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    parse(data, {
      columns: true,
      skip_empty_lines: true
    }, (err: Error | null, records: RawAirport[]) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        return;
      }

      const processedAirports = processAirports(records);
      generateTypeScriptFile(processedAirports);
    });
  });
}).on('error', (error) => {
  console.error('Error downloading airports data:', error);
}); 