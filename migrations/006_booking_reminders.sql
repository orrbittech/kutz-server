-- Idempotent reminder / follow-up tracking for booking notifications
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "reminder1hSentAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "reminder15mSentAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "thankYouSentAt" TIMESTAMPTZ NULL;
