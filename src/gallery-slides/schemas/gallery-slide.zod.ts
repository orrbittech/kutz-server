import { z } from 'zod';

export const gallerySlideResponseSchema = z.object({
  id: z.string().uuid(),
  imageUrl: z.string(),
  alt: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GallerySlideResponse = z.infer<typeof gallerySlideResponseSchema>;
