-- Same definitions as apply-performance-indexes.sql but without CONCURRENTLY (safe inside transactions / seed scripts).

CREATE INDEX IF NOT EXISTS idx_orders_clerk_user_created_at
  ON orders ("clerkUserId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_bookings_clerk_user_created_at
  ON bookings ("clerkUserId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_styles_active_sort_order
  ON styles ("isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS idx_gallery_slides_active_sort_order
  ON gallery_slides ("isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS idx_team_members_active_sort_order
  ON team_members ("isActive", "sortOrder");

CREATE INDEX IF NOT EXISTS idx_booking_styles_style_id
  ON booking_styles ("styleId");
