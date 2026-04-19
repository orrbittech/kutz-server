import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { BookingHoursSpec } from '../site-settings/schemas/site-settings.zod';
import { floorToSlotUtc } from './booking-slot';

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map((x) => Number.parseInt(x, 10));
  return h * 60 + m;
}

/** First matching rule wins. */
function openCloseForJsWeekday(
  spec: BookingHoursSpec,
  jsWeekday: number,
): { openMin: number; closeMin: number } | null {
  for (const r of spec.rules) {
    if (r.daysOfWeek.includes(jsWeekday)) {
      return {
        openMin: hmToMinutes(r.open),
        closeMin: hmToMinutes(r.close),
      };
    }
  }
  return null;
}

/** ISO weekday from format `i`: 1=Mon … 7=Sun → JS 0=Sun … 6=Sat */
function isoDayToJs(iso: number): number {
  return iso === 7 ? 0 : iso;
}

function jsWeekdayForCalendarDayInZone(
  timeZone: string,
  year: number,
  monthIndex: number,
  day: number,
): number {
  const iso = fromZonedTime(
    `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`,
    timeZone,
  );
  const i = Number.parseInt(formatInTimeZone(iso, timeZone, 'i'), 10);
  return isoDayToJs(i);
}

function wallTimeToUtc(
  timeZone: string,
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  return fromZonedTime(iso, timeZone);
}

/**
 * Slot starts on a calendar day in `timeZone`, within configured open/close.
 * `slotStepMinutes` is session + break from site settings.
 */
export function listBookableSlotStartsUtc(
  timeZone: string,
  spec: BookingHoursSpec,
  year: number,
  monthIndex: number,
  day: number,
  slotStepMinutes: number,
  slotStepMs: number,
): Date[] {
  const jsDow = jsWeekdayForCalendarDayInZone(timeZone, year, monthIndex, day);
  const win = openCloseForJsWeekday(spec, jsDow);
  if (!win) return [];
  const { openMin, closeMin } = win;
  if (closeMin <= openMin) return [];
  const out: Date[] = [];
  for (let m = openMin; m < closeMin; m += slotStepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const utc = wallTimeToUtc(timeZone, year, monthIndex, day, hh, mm);
    out.push(floorToSlotUtc(utc, slotStepMs));
  }
  return out;
}

/** True if `instant` is exactly a grid start and falls in an allowed window for that local day. */
export function isValidBookableInstant(
  timeZone: string,
  spec: BookingHoursSpec,
  instant: Date,
  slotStepMinutes: number,
  slotStepMs: number,
): boolean {
  const floored = floorToSlotUtc(instant, slotStepMs);
  const y = Number.parseInt(formatInTimeZone(floored, timeZone, 'yyyy'), 10);
  const mo = Number.parseInt(formatInTimeZone(floored, timeZone, 'MM'), 10) - 1;
  const d = Number.parseInt(formatInTimeZone(floored, timeZone, 'dd'), 10);
  const slots = listBookableSlotStartsUtc(
    timeZone,
    spec,
    y,
    mo,
    d,
    slotStepMinutes,
    slotStepMs,
  );
  const t = floored.getTime();
  return slots.some((s) => s.getTime() === t);
}

/**
 * Unbookable if `nowUtc >= slotStartUtc` (same rule as web `isSlotStartInPast`).
 * Slot instants are UTC; wall-clock "shop day" does not change this ordering.
 */
export function isSlotStartInPast(nowUtc: Date, slotStartUtc: Date): boolean {
  return nowUtc.getTime() >= slotStartUtc.getTime();
}
