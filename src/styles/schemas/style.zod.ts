import { z } from 'zod';
import { styleCategorySchema } from '../../domain/style-categories';

export { styleCategorySchema };

export const styleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  priceCents: z.number().int().nullable(),
  /** When null, clients use site `bookingSessionMinutes` for slot span. */
  durationMinutes: z.number().int().nullable(),
  category: styleCategorySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StyleResponse = z.infer<typeof styleResponseSchema>;
