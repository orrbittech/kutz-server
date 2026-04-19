-- Per-service quantity on a booking (e.g. 5× the same cut).
ALTER TABLE booking_styles
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1
    CHECK (quantity >= 1 AND quantity <= 99);
