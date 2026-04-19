import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OrderStatus } from '../../domain/enums';

const lineItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
});

export const createOrderSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1).max(50),
  notes: z.string().max(2000).optional(),
});

export class CreateOrderBodyDto extends createZodDto(createOrderSchema) {}

const orderStatusZ = z.enum([
  OrderStatus.DRAFT,
  OrderStatus.PAID,
  OrderStatus.FULFILLED,
  OrderStatus.CANCELLED,
]);

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string(),
  status: orderStatusZ,
  totalCents: z.number().int(),
  lineItems: z.array(lineItemSchema),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
