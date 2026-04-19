/** Mirrors `web/src/lib/constants/enums.ts` — keep values aligned manually. */
export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  /** Customer attended; visit closed by admin (thank-you / receipt flow). */
  SERVICED: 'SERVICED',
} as const;

export type BookingStatusValue =
  (typeof BookingStatus)[keyof typeof BookingStatus];

/** Stripe / booking payment lifecycle (orthogonal to BookingStatus for partial pay). */
export const BookingPaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  NOT_REQUIRED: 'NOT_REQUIRED',
} as const;

export type BookingPaymentStatusValue =
  (typeof BookingPaymentStatus)[keyof typeof BookingPaymentStatus];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  PAID: 'PAID',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];
