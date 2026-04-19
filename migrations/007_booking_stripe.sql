-- Stripe payment fields for bookings (ZAR amounts in cents).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS "paymentAmountCents" integer NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_bookings_stripePaymentIntentId"
  ON bookings ("stripePaymentIntentId")
  WHERE "stripePaymentIntentId" IS NOT NULL;
