import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { BookingPaymentStatus, BookingStatus } from '../../domain/enums';

const bookingStatusZ = z.enum([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
  BookingStatus.SERVICED,
]);

const bookingPaymentStatusZ = z.enum([
  BookingPaymentStatus.UNPAID,
  BookingPaymentStatus.PARTIAL,
  BookingPaymentStatus.PAID,
  BookingPaymentStatus.NOT_REQUIRED,
]);

export const styleLineItemSchema = z.object({
  styleId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const createBookingSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
  notes: z.string().max(2000).optional(),
  styleLineItems: z.array(styleLineItemSchema).min(1).max(32),
});

export class CreateBookingBodyDto extends createZodDto(createBookingSchema) {}

export const updateBookingSchema = z
  .object({
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    notes: z.string().max(2000).optional(),
    styleLineItems: z.array(styleLineItemSchema).min(1).max(32).optional(),
  })
  .refine(
    (data) =>
      data.scheduledAt !== undefined ||
      data.notes !== undefined ||
      data.styleLineItems !== undefined,
    {
      message: 'Provide scheduledAt, notes, and/or styleLineItems',
    },
  );

export class UpdateBookingBodyDto extends createZodDto(updateBookingSchema) {}

/** Body for PATCH /bookings/:id/payment — server syncs from Stripe PaymentIntent. */
export const syncBookingPaymentSchema = z.object({});

export class SyncBookingPaymentBodyDto extends createZodDto(
  syncBookingPaymentSchema,
) {}

const styleCategoryZ = z.enum(['men', 'women', 'kids']);

export const bookingStyleSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  priceCents: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  category: styleCategoryZ,
  quantity: z.number().int().min(1).max(99),
});

export const bookingResponseSchema = z.object({
  id: z.string().uuid(),
  bookingCode: z.string().min(1),
  clerkUserId: z.string(),
  scheduledAt: z.string(),
  status: bookingStatusZ,
  notes: z.string(),
  styleId: z.string().uuid().nullable(),
  styleName: z.string().nullable(),
  style: bookingStyleSummarySchema.nullable(),
  styles: z.array(bookingStyleSummarySchema),
  stripePaymentIntentId: z.string().nullable(),
  paymentAmountCents: z.number().int().nullable(),
  paymentStatus: bookingPaymentStatusZ,
  totalDueCents: z.number().int().nullable(),
  amountPaidCents: z.number().int().nullable(),
  outstandingCents: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BookingResponse = z.infer<typeof bookingResponseSchema>;

export const bookingPaymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  amountCents: z.number().int(),
  currency: z.literal('zar'),
});

export type BookingPaymentIntentResponse = z.infer<
  typeof bookingPaymentIntentResponseSchema
>;

const MAX_OCCUPANCY_RANGE_MS = 93 * 24 * 60 * 60 * 1000;

const styleIdsQueryParamSchema = z
  .string()
  .min(1)
  .transform((s, ctx) => {
    const parts = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const r = z.string().uuid().safeParse(p);
      if (!r.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid UUID in styleIds: ${p}`,
        });
        return z.NEVER;
      }
      if (!seen.has(r.data)) {
        seen.add(r.data);
        out.push(r.data);
      }
    }
    if (out.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one styleId',
      });
      return z.NEVER;
    }
    return out;
  });

export const bookingOccupancyQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
    styleIds: styleIdsQueryParamSchema,
  })
  .refine((data) => new Date(data.to) > new Date(data.from), {
    message: 'to must be after from',
    path: ['to'],
  })
  .refine(
    (data) =>
      new Date(data.to).getTime() - new Date(data.from).getTime() <=
      MAX_OCCUPANCY_RANGE_MS,
    { message: 'Date range cannot exceed 93 days', path: ['to'] },
  );

export class BookingOccupancyQueryDto extends createZodDto(
  bookingOccupancyQuerySchema,
) {}

export const bookingOccupancySlotSchema = z.object({
  slotStart: z.string(),
  byStyleId: z.record(z.string().uuid(), z.number().int().min(0)),
});

export const bookingOccupancyResponseSchema = z.object({
  slots: z.array(bookingOccupancySlotSchema),
});

export type BookingOccupancyResponse = z.infer<
  typeof bookingOccupancyResponseSchema
>;
