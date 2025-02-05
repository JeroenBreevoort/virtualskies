-- Add favorited_at and flight_data columns to favorite_flights table
ALTER TABLE favorite_flights
ADD COLUMN IF NOT EXISTS favorited_at BIGINT NOT NULL DEFAULT extract(epoch from now())::bigint,
ADD COLUMN IF NOT EXISTS flight_data TEXT;

-- Add an index on favorited_at for better query performance
CREATE INDEX IF NOT EXISTS idx_favorite_flights_favorited_at ON favorite_flights(favorited_at);

-- Update existing rows to have a favorited_at timestamp if they don't have one
UPDATE favorite_flights 
SET favorited_at = extract(epoch from now())::bigint 
WHERE favorited_at IS NULL;
