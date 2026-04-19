-- Public salon team roster for GET /api/v1/team-members (maps to TeamMemberEntity / table `team_members`).
-- Idempotent: fixed UUID primary keys + ON CONFLICT DO UPDATE.

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY,
  name varchar(255) NOT NULL,
  role varchar(255) NOT NULL,
  "imageUrl" varchar(2048),
  "sortOrder" int NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO team_members (
  id,
  name,
  role,
  "imageUrl",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'b1000000-0000-4000-8000-000000000001',
    'Jordan Lee',
    'Lead stylist',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    10,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'Maya Ortiz',
    'Color specialist',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    20,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'Chris Adeyemi',
    'Barber',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    30,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'Sam Rivera',
    'Senior stylist',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    40,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000005',
    'Taylor Kim',
    'Fade specialist',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    50,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000006',
    'Jamie Collins',
    'Shop lead',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
    60,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "imageUrl" = EXCLUDED."imageUrl",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = now();
