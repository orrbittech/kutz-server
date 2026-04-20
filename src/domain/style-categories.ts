import { z } from 'zod';

/** Catalog segment slugs — keep aligned with `web/lib/constants/style-categories.ts`. */
export const STYLE_CATEGORIES = [
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
] as const;

export type StyleCategory = (typeof STYLE_CATEGORIES)[number];

export const styleCategorySchema = z.enum(STYLE_CATEGORIES);

/** Plain array for OpenAPI `enum` and spreads. */
export const STYLE_CATEGORY_ENUM = [...STYLE_CATEGORIES] as StyleCategory[];
