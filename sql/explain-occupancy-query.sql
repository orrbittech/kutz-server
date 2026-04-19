-- EXPLAIN ANALYZE for BookingsService.getOccupancyForRange (see bookings.service.ts).
-- Replace placeholders with real values from a dev/staging session (status enum,
-- uuid array, step ms, session/break minutes, from/to epoch ms).
-- Run with: psql "$DATABASE_URL" -f server/sql/explain-occupancy-query.sql (requires psql CLI).

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT b."scheduledAt" AS "scheduledAt", bs."styleId" AS "styleId",
       st."durationMinutes" AS "durationMinutes"
FROM bookings b
INNER JOIN booking_styles bs ON bs."bookingId" = b.id
INNER JOIN styles st ON st.id = bs."styleId"
WHERE b.status IN ('PENDING', 'CONFIRMED')
  AND bs."styleId" = ANY(ARRAY['00000000-0000-0000-0000-000000000001']::uuid[])
  AND (
    (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / 600000::bigint) * 600000::bigint)
    + (GREATEST(1, CEIL(COALESCE(st."durationMinutes", 30)::numeric / 10::numeric))::bigint * 600000::bigint)
    > 1700000000000::bigint
  )
  AND (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / 600000::bigint) * 600000::bigint) < 1700000000000::bigint;

-- idx_booking_styles_style_id supports filtering/joining on bs."styleId".
-- idx on bookings(status, scheduledAt) may help range predicates at scale; add only if EXPLAIN shows seq scans on large tables.
