-- Widen styles.category for spa/salon segment slugs (see src/domain/style-categories.ts).

ALTER TABLE styles
  ALTER COLUMN category TYPE varchar(64);

ALTER TABLE styles
  ALTER COLUMN category SET DEFAULT 'hair';

COMMENT ON COLUMN styles.category IS 'Salon/spa catalog segment slug (hair, nails, facials, waxing, etc.)';
