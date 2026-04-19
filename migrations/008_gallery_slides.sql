-- Marketing gallery (Texture & tone) for GET /api/v1/gallery-slides (maps to GallerySlideEntity / table `gallery_slides`).
-- Idempotent: fixed UUID primary keys + ON CONFLICT DO UPDATE.
-- imageUrl values use https://images.unsplash.com (see web/next.config.ts remotePatterns).

CREATE TABLE IF NOT EXISTS gallery_slides (
  id uuid PRIMARY KEY,
  "imageUrl" varchar(2048) NOT NULL,
  alt varchar(512) NOT NULL,
  "sortOrder" int NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO gallery_slides (
  id,
  "imageUrl",
  alt,
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'c2000000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
    'Clean skin fade with sharp lineup',
    10,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
    'Textured crop with natural matte finish',
    20,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000003',
    'https://images.unsplash.com/photo-1762965164662-30126ffccaf1?auto=format&fit=crop&w=1200&q=80',
    'Classic taper with blended neckline',
    30,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000004',
    'https://images.unsplash.com/photo-1678356163587-6bb3afb89679?auto=format&fit=crop&w=1200&q=80',
    'Shears and brush at the styling station',
    40,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000005',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
    'Beard shape and cheek line detail',
    50,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000006',
    'https://images.unsplash.com/photo-1770253980732-dfed1cfdfa43?auto=format&fit=crop&w=1200&q=80',
    'Clipper work and clean taper line',
    60,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  "imageUrl" = EXCLUDED."imageUrl",
  alt = EXCLUDED.alt,
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = now();
