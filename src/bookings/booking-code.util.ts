import { randomInt } from 'node:crypto';
import type { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import type { BookingEntity } from '../database/entities/booking.entity';

/** Unambiguous uppercase alphanumerics (no 0, O, 1, I). */
const BOOKING_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const BOOKING_CODE_LENGTH = 8;

export function generateBookingCode(): string {
  let s = '';
  for (let i = 0; i < BOOKING_CODE_LENGTH; i++) {
    s += BOOKING_CODE_ALPHABET[randomInt(BOOKING_CODE_ALPHABET.length)];
  }
  return s;
}

function isPgUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as { driverError?: { code?: string } }).driverError?.code === '23505'
  );
}

/** Lazy backfill for legacy rows (reminders, webhooks, etc.). */
export async function persistBookingCodeIfMissing(
  repo: Repository<BookingEntity>,
  row: BookingEntity,
): Promise<BookingEntity> {
  if (row.bookingCode?.trim()) {
    return row;
  }
  for (let attempt = 0; attempt < 24; attempt++) {
    row.bookingCode = generateBookingCode();
    try {
      return await repo.save(row);
    } catch (err) {
      if (!isPgUniqueViolation(err)) {
        throw err;
      }
    }
  }
  throw new Error('Could not allocate booking code');
}
