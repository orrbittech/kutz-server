import { z } from 'zod';

export const teamMemberResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TeamMemberResponse = z.infer<typeof teamMemberResponseSchema>;
