-- Optional FK from bookings to styles (service / hairstyle selected at booking time).
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS "styleId" uuid NULL REFERENCES styles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "IDX_bookings_styleId" ON bookings("styleId");
