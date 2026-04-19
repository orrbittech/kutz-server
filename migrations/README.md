# Database migrations / seeds

## Styles catalog

The Nest `StyleEntity` maps to PostgreSQL table **`styles`** (see [`src/database/entities/style.entity.ts`](../src/database/entities/style.entity.ts)). The web app loads these rows from `GET /api/v1/styles`.

### Prerequisites

- `DATABASE_URL` points at your Postgres instance (same value the API uses).
- The `styles` table already exists (via TypeORM `synchronize` in development, or your own migration).

### Apply the seed (recommended)

From the `server` directory, using the same `DATABASE_URL` as the API (read from `server/.env`):

```bash
npm run seed:styles
```

This runs [`scripts/seed-styles.cjs`](../scripts/seed-styles.cjs), which uses the `pg` package — **you do not need the `psql` CLI**. On each run it **first deletes all rows** from `gallery_slides`, `team_members`, and `styles` (deleting styles cascades `booking_styles` and sets `bookings.styleId` to `NULL`). Then it applies SQL in this order: `002_styles_category.sql`, `001_seed_styles.sql`, `005_team_members.sql`, `008_gallery_slides.sql` (styles catalog, team roster, Texture & tone gallery slides).

If `DATABASE_URL` is already exported in your environment, that value wins over `.env` (the script only fills unset variables from `.env`).

### Manual `psql` (optional)

If you prefer the Postgres client:

```bash
set -a && source .env && set +a && psql "$DATABASE_URL" -f migrations/002_styles_category.sql && psql "$DATABASE_URL" -f migrations/001_seed_styles.sql
```

When `synchronize` is enabled in dev, TypeORM may add `category` automatically; you can still run `002` safely (`IF NOT EXISTS`).

The seed files use fixed UUIDs and `ON CONFLICT (id) DO UPDATE` (upsert) after the wipe so each run repopulates a clean slate. Re-running the script always clears marketing/catalog rows first, then inserts the canonical seed data again.

### Column names

SQL uses quoted camelCase identifiers (`"imageUrl"`, `"sortOrder"`, etc.) to match TypeORM’s default column naming for this project. The `category` column is lowercase unquoted. If your database was created with a different naming strategy, inspect the table (`\d styles` in `psql`) and adjust the seed file accordingly.

## Stripe booking payments

Apply [`007_booking_stripe.sql`](007_booking_stripe.sql) when not relying on TypeORM `synchronize` (e.g. production).

Local webhooks: install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then forward events to the Nest API (default port `4400`):

```bash
stripe listen --forward-to http://localhost:4400/api/v1/webhooks/stripe
```

Use the CLI’s `webhook signing secret` as `STRIPE_WEBHOOK_SECRET` in `server/.env`. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your **test** keys from the Stripe Dashboard.

## Booking slots, occupancy, and status

Apply [`009_booking_hours.sql`](009_booking_hours.sql) and [`010_booking_status_serviced.sql`](010_booking_status_serviced.sql) when not using TypeORM `synchronize`.

**Double-booking:** `GET /api/v1/public/bookings/occupancy` returns counts per 15-minute UTC slot for `PENDING` and `CONFIRMED` bookings only. The web picker marks occupied slots as unavailable. Creating or updating a booking still runs a transactional conflict check; if another active booking holds the same slot, the API returns **409 Conflict**. Under extreme concurrent requests, the database could theoretically race between the read and insert; if you need a stronger guarantee, consider a partial unique index on normalized slot boundaries for active statuses or row-level locking around the conflict check (optional hardening).

**Slot math (web + server):** [`server/src/bookings/booking-hours.util.ts`](../src/bookings/booking-hours.util.ts) and [`web/lib/booking-hours.ts`](../../web/lib/booking-hours.ts) implement the same booking window and 15-minute grid. Keep them in sync when changing rules, or extract a shared package later.
