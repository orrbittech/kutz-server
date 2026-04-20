'use strict';

/**
 * Full wipe then reapplies styles, team roster, gallery slides, and default site booking hours using the same DATABASE_URL as the Nest app (server/.env).
 *
 * Cleanup: drops named performance indexes (see sql/drop-performance-indexes.sql), then TRUNCATE all application tables (bookings, orders, catalog, site_settings, etc.) with RESTART IDENTITY CASCADE so every seed starts from an empty database. Recreates indexes after seed SQL via sql/apply-performance-indexes-sync.sql.
 *
 * Gallery imageUrl values are https://images.unsplash.com/... (see migrations/008_gallery_slides.sql).
 * Style catalog rows come from scripts/data/spa-services.json (see migrations/README.md).
 * Does not require the `psql` CLI — uses the `pg` package.
 *
 * Image URLs: by default each style `imageUrl` is checked over the network (HEAD, then GET if needed).
 * Set SEED_SKIP_IMAGE_CHECK=1 to skip HTTP checks (offline / locked-down CI).
 */

const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

/** Canonical slugs — keep aligned with `server/src/domain/style-categories.ts`. */
const CANONICAL_STYLE_CATEGORIES = [
  'hair',
  'nails',
  'skin',
  'waxing',
  'massage',
  'beauty',
  'wellness',
  'tanning',
  'piercing',
  'retail',
];

const CANONICAL_SET = new Set(CANONICAL_STYLE_CATEGORIES);

/** Legacy spa-services / API slugs → canonical (defense in depth vs JSON drift). */
const LEGACY_CATEGORY_TO_CANONICAL = {
  mens_grooming: 'hair',
  lightening: 'hair',
  pedicures: 'nails',
  facials: 'skin',
  skincare: 'skin',
  skin_lab: 'skin',
  body: 'massage',
  makeup: 'beauty',
  lashes: 'beauty',
  brows: 'beauty',
  iv_drip: 'wellness',
  ears: 'piercing',
  nose: 'piercing',
  piercings: 'piercing',
  products: 'retail',
};

const DEFAULT_IMAGE_URL_BY_CATEGORY = {
  hair:
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  nails:
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
  skin:
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b1?auto=format&fit=crop&w=800&q=80',
  waxing:
    'https://images.unsplash.com/photo-1519415943484-9fa3edd97332?auto=format&fit=crop&w=800&q=80',
  massage:
    'https://images.unsplash.com/photo-1600334085748-110949598c42?auto=format&fit=crop&w=800&q=80',
  beauty:
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80',
  wellness:
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  tanning:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  piercing:
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
  retail:
    'https://images.unsplash.com/photo-1441986300917-64774bdce8c9?auto=format&fit=crop&w=800&q=80',
};

const FETCH_HEADERS = {
  'User-Agent': 'KUTZ-catalog-seed/1.0 (+https://github.com)',
  Accept: 'image/*,*/*;q=0.8',
};

const IMAGE_CHECK_TIMEOUT_MS = 10_000;
const IMAGE_CHECK_CONCURRENCY = 6;

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

function toCanonicalCategory(raw) {
  const k = String(raw ?? '').trim();
  if (CANONICAL_SET.has(k)) return k;
  const mapped = LEGACY_CATEGORY_TO_CANONICAL[k];
  if (mapped) return mapped;
  throw new Error(
    `[seed] Unknown style category ${JSON.stringify(raw)}. Expected one of: ${[
      ...CANONICAL_STYLE_CATEGORIES,
      ...Object.keys(LEGACY_CATEGORY_TO_CANONICAL),
    ].join(', ')}`,
  );
}

async function imageUrlIsReachable(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_CHECK_TIMEOUT_MS);
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: FETCH_HEADERS,
    });
    if (headRes.ok) return true;
    // CDNs often reject HEAD (403/404) while a byte-ranged GET succeeds.
    const getRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { ...FETCH_HEADERS, Range: 'bytes=0-8191' },
    });
    return getRes.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

async function resolveImageUrlsForRows(rows) {
  const skip =
    process.env.SEED_SKIP_IMAGE_CHECK === '1' ||
    process.env.SEED_SKIP_IMAGE_CHECK === 'true';
  if (skip) {
    console.log(
      '[seed] SEED_SKIP_IMAGE_CHECK set — skipping HTTP image checks (using JSON URLs or category defaults for blanks only).',
    );
    let blankFallbacks = 0;
    const out = rows.map((r) => {
      const category = toCanonicalCategory(r.category);
      const raw = typeof r.imageUrl === 'string' ? r.imageUrl.trim() : '';
      if (!raw) {
        blankFallbacks += 1;
        return {
          ...r,
          category,
          imageUrl: DEFAULT_IMAGE_URL_BY_CATEGORY[category],
        };
      }
      return { ...r, category, imageUrl: raw };
    });
    if (blankFallbacks > 0) {
      console.log(
        `[seed] Replaced ${blankFallbacks} blank imageUrl(s) with category defaults.`,
      );
    }
    return out;
  }

  const meta = await mapWithConcurrency(rows, IMAGE_CHECK_CONCURRENCY, async (r) => {
    const category = toCanonicalCategory(r.category);
    const raw = typeof r.imageUrl === 'string' ? r.imageUrl.trim() : '';
    const fallback = DEFAULT_IMAGE_URL_BY_CATEGORY[category];
    if (!raw) {
      return {
        row: { ...r, category, imageUrl: fallback },
        replaced: true,
        reason: 'blank',
        name: r.name,
      };
    }
    const ok = await imageUrlIsReachable(raw);
    if (ok) {
      return { row: { ...r, category, imageUrl: raw }, replaced: false };
    }
    return {
      row: { ...r, category, imageUrl: fallback },
      replaced: true,
      reason: 'unreachable',
      name: r.name,
    };
  });

  let replaced = 0;
  const samples = [];
  const normalized = meta.map((m) => {
    if (m.replaced) {
      replaced += 1;
      if (samples.length < 8) {
        samples.push(`${m.name} (${m.reason})`);
      }
    }
    return m.row;
  });

  console.log(
    `[seed] Image checks: ${replaced}/${rows.length} row(s) used category default image.`,
  );
  if (samples.length > 0) {
    console.log('[seed] Examples:', samples.join('; '));
  }
  return normalized;
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
    '012_widen_styles_category.sql',
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

    await insertSpaServicesFromJson(client);

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

async function insertSpaServicesFromJson(client) {
  const dataPath = join(__dirname, 'data', 'spa-services.json');
  if (!existsSync(dataPath)) {
    throw new Error(
      `[seed] Missing ${dataPath}. Add spa-services.json with the catalog rows.`,
    );
  }
  const rows = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(rows) || rows.length < 1) {
    throw new Error(
      `[seed] spa-services.json must be a non-empty array, got ${Array.isArray(rows) ? rows.length : typeof rows}`,
    );
  }

  const prepared = await resolveImageUrlsForRows(rows);

  const text = `
    INSERT INTO styles (
      id,
      name,
      description,
      "imageUrl",
      "sortOrder",
      "isActive",
      "priceCents",
      "durationMinutes",
      category,
      "createdAt",
      "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now()
    )
  `;
  for (const r of prepared) {
    await client.query(text, [
      r.id,
      r.name,
      r.description,
      r.imageUrl,
      r.sortOrder,
      r.isActive,
      r.priceCents,
      r.durationMinutes ?? null,
      r.category,
    ]);
  }
  console.log('[seed] Inserted', prepared.length, 'styles from spa-services.json');
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
