ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS "smsBookingRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailBookingRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "smsThankYouReceiptEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailThankYouReceiptEnabled" BOOLEAN NOT NULL DEFAULT true;
