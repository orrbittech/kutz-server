-- Add salon catalog segment for StyleEntity.category (men | women | kids).
-- Run before 001_seed_styles.sql when applying seeds to an existing DB without TypeORM synchronize.

ALTER TABLE styles
  ADD COLUMN IF NOT EXISTS category varchar(16) NOT NULL DEFAULT 'men';

COMMENT ON COLUMN styles.category IS 'Salon catalog segment: men, women, or kids';
