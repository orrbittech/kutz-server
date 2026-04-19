-- Seed active rows for GET /api/v1/styles (maps to StyleEntity / table `styles`).
-- Requires column `category` (see 002_styles_category.sql or TypeORM synchronize).
-- Idempotent: fixed UUID primary keys + ON CONFLICT DO UPDATE (upsert) so re-runs refresh copy and images.

INSERT INTO styles (
  id,
  name,
  description,
  "imageUrl",
  "sortOrder",
  "isActive",
  "priceCents",
  category,
  "createdAt",
  "updatedAt"
) VALUES
  -- Men (7)
  (
    'a1000000-0000-4000-8000-000000000001',
    'Classic taper & finish',
    'Consultation, scissor-over-comb taper, and finish for your hair texture.',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    10,
    true,
    45000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Skin fade',
    'Clean taper with a sharp fade and detailed lineup.',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    20,
    true,
    55000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Buzz cut',
    'Even guard length all over — quick, neat, and low maintenance.',
    'https://images.unsplash.com/photo-1775135999428-627bf00683d1?auto=format&fit=crop&w=800&q=80',
    30,
    true,
    22000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Crew cut',
    'Short back and sides with a tidy, uniform top.',
    'https://images.unsplash.com/photo-1762965164662-30126ffccaf1?auto=format&fit=crop&w=800&q=80',
    40,
    true,
    28000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Textured crop',
    'Movement and lift with point cutting and matte finish.',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    50,
    true,
    48000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000006',
    'Beard sculpt & line-up',
    'Shape, trim, and crisp edges mapped to your jawline.',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
    60,
    true,
    32000,
    'men',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000007',
    'Slick back & taper',
    'Longer top styled back with clean sides.',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    70,
    true,
    52000,
    'men',
    now(),
    now()
  ),
  -- Women (7)
  (
    'a1000000-0000-4000-8000-000000000008',
    'Precision bob',
    'Sharp perimeter, internal texture, and polished blow-dry.',
    'https://images.unsplash.com/photo-1712213396688-c6f2d536671f?auto=format&fit=crop&w=800&q=80',
    80,
    true,
    65000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000009',
    'Long layers & trim',
    'Face-framing layers, healthy ends, and movement.',
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
    90,
    true,
    58000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000010',
    'Curly shape & define',
    'Cut dry for curl pattern, hydrate, and style coaching.',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
    100,
    true,
    72000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000011',
    'Balayage refresh',
    'Hand-painted lightening and toner gloss for natural grow-out.',
    'https://images.unsplash.com/photo-1707720531504-ce087725861a?auto=format&fit=crop&w=800&q=80',
    110,
    true,
    185000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000012',
    'Smoothing blowout',
    'Wash, blow-dry, and smooth finish for shine and hold.',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    120,
    true,
    45000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000013',
    'Fringe trim & style',
    'Bangs shaped to your face and blended into the cut.',
    'https://images.unsplash.com/photo-1768363446104-b8a0c1716600?auto=format&fit=crop&w=800&q=80',
    130,
    true,
    35000,
    'women',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000014',
    'Formal upstyle',
    'Pinned or braided upstyle for events — consult on length.',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
    140,
    true,
    95000,
    'women',
    now(),
    now()
  ),
  -- Kids (6)
  (
    'a1000000-0000-4000-8000-000000000015',
    'Kids classic cut',
    'Patient service for school-age clients with a neat finish.',
    'https://images.unsplash.com/photo-1703792685152-d13e206924d8?auto=format&fit=crop&w=800&q=80',
    150,
    true,
    32000,
    'kids',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000016',
    'First haircut package',
    'Keepsake-friendly first cut with extra time and photos welcome.',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
    160,
    true,
    28000,
    'kids',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000017',
    'Toddler tidy-up',
    'Gentle trim around ears and fringe — short appointment.',
    'https://images.unsplash.com/photo-1521490878864-a50e9fcb5718?auto=format&fit=crop&w=800&q=80',
    170,
    true,
    30000,
    'kids',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000018',
    'Teen fade',
    'Trend-led fade and style for teens — parent consult optional.',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    180,
    true,
    42000,
    'kids',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000019',
    'School-photo trim',
    'Neat, even length for picture day — quick in and out.',
    'https://images.unsplash.com/photo-1561087385-0ef90642f75a?auto=format&fit=crop&w=800&q=80',
    190,
    true,
    26000,
    'kids',
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000020',
    'Girls braids refresh',
    'Take-down, detangle, and simple braids or pony styling.',
    'https://images.unsplash.com/photo-1757866332696-ce0edc39b733?auto=format&fit=crop&w=800&q=80',
    200,
    true,
    55000,
    'kids',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "imageUrl" = EXCLUDED."imageUrl",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "priceCents" = EXCLUDED."priceCents",
  category = EXCLUDED.category,
  "updatedAt" = now();
