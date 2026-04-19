-- Marketing gallery (Texture & tone) for GET /api/v1/gallery-slides (maps to GallerySlideEntity / table `gallery_slides`).
-- Idempotent: fixed UUID primary keys + ON CONFLICT DO UPDATE.
-- imageUrl paths are served from web/public (e.g. /images/gallery/01.jpg).

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
    '/images/gallery/01.jpg',
    'Clean skin fade with sharp lineup',
    10,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    '/images/gallery/02.jpg',
    'Textured crop with natural matte finish',
    20,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000003',
    '/images/gallery/03.jpg',
    'Classic taper with blended neckline',
    30,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000004',
    '/images/gallery/04.jpg',
    'Longer top with styled fringe',
    40,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000005',
    '/images/gallery/05.jpg',
    'Beard shape and cheek line detail',
    50,
    true,
    now(),
    now()
  ),
  (
    'c2000000-0000-4000-8000-000000000006',
    '/images/gallery/06.jpg',
    'Low burst fade with defined part',
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
