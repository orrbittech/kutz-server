import type { SiteSettingsPublic } from '../site-settings/schemas/site-settings.zod';

export function bookingSlotStepMs(
  settings: Pick<SiteSettingsPublic, 'bookingSlotStepMinutes'>,
): number {
  return settings.bookingSlotStepMinutes * 60 * 1000;
}

/** Floor instant to the start of its UTC slot on the configured grid. */
export function floorToSlotUtc(scheduledAt: Date, slotStepMs: number): Date {
  if (slotStepMs <= 0) {
    throw new Error('slotStepMs must be positive');
  }
  return new Date(Math.floor(scheduledAt.getTime() / slotStepMs) * slotStepMs);
}

/** End of the grid cell containing slotStart (exclusive upper bound for range queries). */
export function slotGridEndUtc(slotStart: Date, slotStepMs: number): Date {
  return new Date(slotStart.getTime() + slotStepMs);
}

/** Approximate service end time for customer messaging (session length only). */
export function serviceEndUtc(slotStart: Date, sessionMinutes: number): Date {
  return new Date(slotStart.getTime() + sessionMinutes * 60 * 1000);
}

/** Number of grid slots a service occupies (at least one). */
export function slotSpanForStyleMinutes(
  durationMinutes: number,
  bookingSlotStepMinutes: number,
): number {
  if (bookingSlotStepMinutes <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(durationMinutes / bookingSlotStepMinutes));
}
