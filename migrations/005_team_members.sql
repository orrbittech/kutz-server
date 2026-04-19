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
    'Thapelo Ndlovu',
    'Master barber',
    'https://images.pexels.com/photos/2881253/pexels-photo-2881253.jpeg?auto=compress&cs=tinysrgb&w=600',
    10,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'Marcus Washington',
    'Lead barber',
    'https://images.pexels.com/photos/7697445/pexels-photo-7697445.jpeg?auto=compress&cs=tinysrgb&w=600',
    20,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'Jaxson Botha',
    'Fade specialist',
    'https://images.pexels.com/photos/4625623/pexels-photo-4625623.jpeg?auto=compress&cs=tinysrgb&w=600',
    30,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'Marco Naidoo',
    'Creative director',
    'https://images.pexels.com/photos/331989/pexels-photo-331989.jpeg?auto=compress&cs=tinysrgb&w=600',
    40,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000005',
    'Nomvula Mokoena',
    'Senior stylist',
    'https://images.pexels.com/photos/3993320/pexels-photo-3993320.jpeg?auto=compress&cs=tinysrgb&w=600',
    50,
    true,
    now(),
    now()
  ),
  (
    'b1000000-0000-4000-8000-000000000006',
    'Ayanda Sibiya',
    'Lead stylist',
    'https://images.pexels.com/photos/28743778/pexels-photo-28743778.jpeg?auto=compress&cs=tinysrgb&w=600',
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
