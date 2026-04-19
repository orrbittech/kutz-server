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

function collectStyleLines(
  row: BookingEntity,
): { style: StyleEntity; quantity: number }[] {
  const fromLinks =
    row.bookingStyles
      ?.filter((l): l is typeof l & { style: StyleEntity } =>
        Boolean(l.style),
      )
      .map((l) => ({ style: l.style, quantity: l.quantity ?? 1 })) ?? [];
  if (fromLinks.length > 0) {
    return [...fromLinks].sort((a, b) =>
      a.style.name.localeCompare(b.style.name),
    );
  }
  return row.style ? [{ style: row.style, quantity: 1 }] : [];
}

export function buildBookingCustomerPayload(
  row: BookingEntity,
  businessName: string,
  slotStepMs: number,
  sessionMinutes: number,
): BookingCustomerPayload {
  const lines = collectStyleLines(row);
  const styleNames =
    lines.length > 0
      ? lines
          .map(({ style, quantity }) =>
            quantity > 1 ? `${style.name} × ${quantity}` : style.name,
          )
          .join(' · ')
      : 'Appointment';
  const scheduledAtIso = row.scheduledAt.toISOString();
  const slotStart = floorToSlotUtc(row.scheduledAt, slotStepMs);
  const serviceEndIso = serviceEndUtc(slotStart, sessionMinutes).toISOString();
  const receiptLines: string[] = [];
  let totalCents = 0;
  for (const { style, quantity } of lines) {
    const unit = style.priceCents;
    const lineTotal =
      unit != null ? unit * quantity : null;
    if (lineTotal != null) {
      totalCents += lineTotal;
    }
    if (quantity > 1) {
      receiptLines.push(
        `${style.name} × ${quantity}: ${formatZar(lineTotal)}`,
      );
    } else {
      receiptLines.push(`${style.name}: ${formatZar(unit)}`);
    }
  }
  const totalLine =
    totalCents > 0 ? `Total: ${formatZar(totalCents)}` : 'Total: —';
  const receiptSummaryText =
    receiptLines.length > 0 ? [...receiptLines, totalLine].join('\n') : '—';

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
