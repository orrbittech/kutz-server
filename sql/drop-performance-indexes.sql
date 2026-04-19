-- Drops named indexes (matches @Index in entities and apply-performance-indexes.sql).
-- Used by scripts/seed-styles.cjs before TRUNCATE so a full re-seed can rebuild a clean index set.

DROP INDEX IF EXISTS idx_orders_clerk_user_created_at;
DROP INDEX IF EXISTS idx_bookings_clerk_user_created_at;
DROP INDEX IF EXISTS idx_styles_active_sort_order;
DROP INDEX IF EXISTS idx_gallery_slides_active_sort_order;
DROP INDEX IF EXISTS idx_team_members_active_sort_order;
DROP INDEX IF EXISTS idx_booking_styles_style_id;
