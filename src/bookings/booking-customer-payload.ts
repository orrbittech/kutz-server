import type { BookingEntity } from '../database/entities/booking.entity';
import type { StyleEntity } from '../database/entities/style.entity';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
} from '../notifications/booking-notification.types';
import { floorToSlotUtc, serviceEndUtc } from './booking-slot';

function formatZar(cents: number | null): string {
  if (cents == null) {
    return '—';
  }
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(cents / 100);
}

function collectStyles(row: BookingEntity): StyleEntity[] {
  const fromLinks =
    row.bookingStyles?.map((l) => l.style).filter(Boolean) ?? [];
  if (fromLinks.length > 0) {
    return [...fromLinks].sort((a, b) => a.name.localeCompare(b.name));
  }
  return row.style ? [row.style] : [];
}

export function buildBookingCustomerPayload(
  row: BookingEntity,
  businessName: string,
  slotStepMs: number,
  sessionMinutes: number,
): BookingCustomerPayload {
  const styles = collectStyles(row);
  const styleNames =
    styles.length > 0
      ? styles.map((s) => s.name).join(' · ')
      : 'Appointment';
  const scheduledAtIso = row.scheduledAt.toISOString();
  const slotStart = floorToSlotUtc(row.scheduledAt, slotStepMs);
  const serviceEndIso = serviceEndUtc(slotStart, sessionMinutes).toISOString();
  const lines: string[] = [];
  let totalCents = 0;
  for (const s of styles) {
    lines.push(`${s.name}: ${formatZar(s.priceCents)}`);
    if (s.priceCents != null) {
      totalCents += s.priceCents;
    }
  }
  const totalLine =
    totalCents > 0 ? `Total: ${formatZar(totalCents)}` : 'Total: —';
  const receiptSummaryText =
    lines.length > 0 ? [...lines, totalLine].join('\n') : '—';

  return {
    bookingId: row.id,
    bookingCode: row.bookingCode?.trim() ?? '',
    scheduledAtIso,
    serviceEndIso,
    styleNames,
    businessName,
    receiptSummaryText,
  };
}

export function buildBookingPaymentConfirmedPayload(
  row: BookingEntity,
  businessName: string,
  slotStepMs: number,
  sessionMinutes: number,
  payment: {
    amountPaidCents: number;
    totalDueCents: number;
    outstandingCents: number;
    paymentStatus: string;
  },
): BookingPaymentConfirmedPayload {
  return {
    ...buildBookingCustomerPayload(
      row,
      businessName,
      slotStepMs,
      sessionMinutes,
    ),
    ...payment,
  };
}
