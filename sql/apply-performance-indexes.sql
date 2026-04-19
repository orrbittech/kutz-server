-- Apply when TypeORM synchronize is false (e.g. production Railway).
-- Names match @Index(...) decorators on entities. Use CONCURRENTLY in production
-- to avoid long locks (run outside a transaction; one statement at a time).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_clerk_user_created_at
  ON orders ("clerkUserId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_clerk_user_created_at
  ON bookings ("clerkUserId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_styles_active_sort_order
  ON styles ("isActive", "sortOrder");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gallery_slides_active_sort_order
  ON gallery_slides ("isActive", "sortOrder");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_active_sort_order
  ON team_members ("isActive", "sortOrder");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_styles_style_id
  ON booking_styles ("styleId");

-- If upgrading from an older schema that only had a single-column index on
-- clerkUserId, drop it after verifying the new composite index is used:
-- DROP INDEX CONCURRENTLY IF EXISTS "IDX_<legacy>";
