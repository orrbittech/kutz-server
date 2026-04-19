-- Machine-readable booking windows + IANA timezone for slot generation (see bookingHoursSpec schema).
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS "bookingTimeZone" VARCHAR(64) NOT NULL DEFAULT 'Africa/Johannesburg',
  ADD COLUMN IF NOT EXISTS "bookingHoursSpecJson" TEXT NOT NULL DEFAULT '[]';
