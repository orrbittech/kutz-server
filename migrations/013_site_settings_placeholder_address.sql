-- Replace legacy dev default address with obvious placeholder data (footer / JSON-LD).
UPDATE site_settings
SET
  "addressLine1" = '7 Imaginary Crescent, Widget Park',
  city = 'Samplefield',
  region = 'Demo Province',
  "postalCode" = '0000',
  latitude = -33.9249,
  longitude = 18.4241,
  "updatedAt" = now()
WHERE id = 'default'
  AND "addressLine1" = '352 Van Heerden, Halfway Gardens';
