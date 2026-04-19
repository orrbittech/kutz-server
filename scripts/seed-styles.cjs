'use strict';

/**
 * Clears then reapplies styles, team roster, gallery slides, and default site booking hours using the same DATABASE_URL as the Nest app (server/.env).
 *
 * Cleanup: deletes all rows from `gallery_slides`, `team_members`, and `styles` (in an order safe for FKs).
 * Deleting `styles` cascades to `booking_styles` and sets `bookings.styleId` to NULL (ON DELETE SET NULL).
 *
 * Gallery imageUrl values are paths like /images/gallery/01.jpg (served from web/public).
 * Does not require the `psql` CLI — uses the `pg` package.
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadEnvFile();
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string' || url.length === 0) {
    console.error(
      'DATABASE_URL is not set. Add it to server/.env (same as the API) or export it in your shell.',
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  const migrationsDir = join(__dirname, '..', 'migrations');
  const files = [
    '002_styles_category.sql',
    '001_seed_styles.sql',
    '005_team_members.sql',
    '008_gallery_slides.sql',
    '009_booking_hours.sql',
    '011_seed_site_settings_booking_hours.sql',
  ];

  try {
    await clearMarketingSeedTables(client);

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log('Applied:', file);
    }
    console.log('Styles, team, gallery, and site booking hours seed finished.');
  } finally {
    await client.end();
  }
}

/**
 * Removes existing seed data so the following INSERTs start from an empty catalog.
 * Safe for bookings: `styles` delete cascades `booking_styles` and nulls `bookings.styleId`.
 * Skips tables that do not exist yet (e.g. first run before `008_gallery_slides.sql` has created `gallery_slides`).
 */
async function clearMarketingSeedTables(client) {
  const { rows } = await client.query(
    `
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY($1::text[])
    `,
    [['gallery_slides', 'team_members', 'styles']],
  );
  const present = new Set(rows.map((r) => r.tablename));
  if (present.size === 0) {
    console.warn(
      'No marketing seed tables found yet (gallery_slides, team_members, styles); skipping clear.',
    );
    return;
  }

  const statements = [];
  if (present.has('gallery_slides')) statements.push('DELETE FROM gallery_slides');
  if (present.has('team_members')) statements.push('DELETE FROM team_members');
  if (present.has('styles')) statements.push('DELETE FROM styles');

  await client.query('BEGIN');
  try {
    await client.query(statements.join(';\n') + ';');
    await client.query('COMMIT');
    const cleared = [...present].join(', ');
    const bookingNote = present.has('styles')
      ? ' Styles delete cascades booking_styles and sets bookings.styleId to NULL.'
      : '';
    console.log(`Cleared rows from: ${cleared}.${bookingNote}`);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err && err.code === '42P01') {
      console.error(
        'A required table is missing. Start the Nest API once with TypeORM synchronize enabled in dev, or create the schema, then run this script again.',
      );
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
