-- Default booking window: every day 07:00–20:00 (see DEFAULT_BOOKING_HOURS in site-settings.zod.ts).
-- No-op if site_settings has no row with id = default yet.
UPDATE site_settings
SET
  "bookingHoursSpecJson" = '{"rules":[{"daysOfWeek":[0,1,2,3,4,5,6],"open":"07:00","close":"20:00"}]}',
  "openingHoursSpecJson" = '["Mo-Su 07:00-20:00"]'
WHERE id = 'default';
