'use strict';

/**
 * Full wipe then reapplies styles, team roster, gallery slides, and default site booking hours using the same DATABASE_URL as the Nest app (server/.env).
 *
 * Cleanup: drops named performance indexes (see sql/drop-performance-indexes.sql), then TRUNCATE all application tables (bookings, orders, catalog, site_settings, etc.) with RESTART IDENTITY CASCADE so every seed starts from an empty database. Recreates indexes after seed SQL via sql/apply-performance-indexes-sync.sql.
 *
 * Gallery imageUrl values are https://images.unsplash.com/... (see migrations/008_gallery_slides.sql).
 * Does not require the `psql` CLI — uses the `pg` package.
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

/** Tables matching TypeORM entities in src/database/entities (public schema). */
const APP_TABLES = [
  'booking_styles',
  'bookings',
  'orders',
  'gallery_slides',
  'team_members',
  'styles',
  'site_settings',
];

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

/** Logs host and database name from DATABASE_URL (no credentials). */
function logDatabaseTarget(connectionString) {
  try {
    const normalized = connectionString.replace(/^postgres(ql)?:/i, 'http:');
    const u = new URL(normalized);
    const host = u.hostname || '(unknown)';
    const db = u.pathname ? u.pathname.replace(/^\//, '').split('/')[0] : '';
    const port = u.port ? `:${u.port}` : '';
    console.log(
      `[seed] Target DB: host ${host}${port}${db ? `, database ${db}` : ''}`,
    );
  } catch {
    console.warn('[seed] Could not parse DATABASE_URL for logging (proceeding).');
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

  logDatabaseTarget(url);

  const client = new Client({ connectionString: url });
  await client.connect();

  const migrationsDir = join(__dirname, '..', 'migrations');
  const files = [
    '002_styles_category.sql',
    '001_seed_styles.sql',
    '005_team_members.sql',
    '008_gallery_slides.sql',
    '009_booking_hours.sql',
    '010_ensure_site_settings_default.sql',
    '011_seed_site_settings_booking_hours.sql',
  ];

  try {
    await dropPerformanceIndexes(client);
    await truncateAllAppTables(client);

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log('Applied:', file);
    }

    await createPerformanceIndexes(client);
    console.log('Styles, team, gallery, and site booking hours seed finished.');
  } finally {
    await client.end();
  }
}

/**
 * Removes all rows from every app table so the following SQL runs against an empty database.
 * Skips tables that do not exist yet (partial schema); truncates only those that exist.
 */
async function dropPerformanceIndexes(client) {
  const dropPath = join(sqlDirForSeed(), 'drop-performance-indexes.sql');
  if (!existsSync(dropPath)) {
    console.warn('[seed] Missing sql/drop-performance-indexes.sql; skipping index drop.');
    return;
  }
  const sql = readFileSync(dropPath, 'utf8');
  await client.query(sql);
  console.log('[seed] Dropped performance indexes (if they existed).');
}

async function createPerformanceIndexes(client) {
  const createPath = join(sqlDirForSeed(), 'apply-performance-indexes-sync.sql');
  if (!existsSync(createPath)) {
    console.warn('[seed] Missing sql/apply-performance-indexes-sync.sql; skipping index create.');
    return;
  }
  const sql = readFileSync(createPath, 'utf8');
  await client.query(sql);
  console.log('[seed] Recreated performance indexes.');
}

function sqlDirForSeed() {
  return join(__dirname, '..', 'sql');
}

async function truncateAllAppTables(client) {
  const { rows } = await client.query(
    `
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY($1::text[])
    `,
    [APP_TABLES],
  );
  const present = rows.map((r) => r.tablename);
  if (present.length === 0) {
    console.warn(
      '[seed] No application tables found yet; skipping truncate. Create the schema (e.g. run the API with synchronize), then run this script again.',
    );
    return;
  }

  const quoted = present
    .map((t) => `"${String(t).replace(/"/g, '""')}"`)
    .join(', ');
  await client.query(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
  );
  console.log('[seed] Truncated tables:', [...present].sort().join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
