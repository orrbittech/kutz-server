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
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80',
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
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
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
