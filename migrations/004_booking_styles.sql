-- Many-to-many: one booking can include multiple catalog styles in a single slot.
CREATE TABLE IF NOT EXISTS booking_styles (
  "bookingId" uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  "styleId" uuid NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  PRIMARY KEY ("bookingId", "styleId")
);

CREATE INDEX IF NOT EXISTS "IDX_booking_styles_styleId" ON booking_styles("styleId");
