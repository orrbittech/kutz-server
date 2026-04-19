export type BookingReminderKind = '1h' | '15m';

export type BookingCustomerPayload = {
  bookingId: string;
  bookingCode: string;
  scheduledAtIso: string;
  serviceEndIso: string;
  styleNames: string;
  businessName: string;
  /** Plain-text receipt-style lines (services + optional totals) */
  receiptSummaryText: string;
};

/** Sent to customer after Stripe payment (full or partial). */
export type BookingPaymentConfirmedPayload = BookingCustomerPayload & {
  amountPaidCents: number;
  totalDueCents: number;
  outstandingCents: number;
  paymentStatus: string;
};
