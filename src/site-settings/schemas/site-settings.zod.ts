import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const themeTokensSchema = z.object({
  brandBrown: z.string(),
  brandCream: z.string(),
  brandOrange: z.string(),
  brandWhite: z.string(),
  background: z.string(),
  foreground: z.string(),
  primary: z.string(),
  muted: z.string(),
  card: z.string(),
  border: z.string(),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

/** JS getDay(): 0 = Sunday … 6 = Saturday */
export const bookingHoursRuleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
});

export const bookingHoursSpecSchema = z.object({
  rules: z.array(bookingHoursRuleSchema).min(1),
});

export type BookingHoursSpec = z.infer<typeof bookingHoursSpecSchema>;

export const DEFAULT_BOOKING_TIME_ZONE = 'Africa/Johannesburg';

/** Default: every day 07:00–20:00 (JS weekday: 0=Sun … 6=Sat) */
export const DEFAULT_BOOKING_HOURS: BookingHoursSpec = {
  rules: [
    { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], open: '07:00', close: '20:00' },
  ],
};

export const siteSettingsPublicSchema = z.object({
  businessName: z.string(),
  addressLine1: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
  phone: z.string(),
  publicEmail: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  openingHours: z.array(z.string()),
  /** IANA timezone for booking slot boundaries */
  bookingTimeZone: z.string().min(1).max(64),
  bookingHours: bookingHoursSpecSchema,
  defaultLocale: z.string(),
  theme: themeTokensSchema,
  smsBookingNotificationsEnabled: z.boolean(),
  emailBookingNotificationsEnabled: z.boolean(),
  smsBookingRemindersEnabled: z.boolean(),
  emailBookingRemindersEnabled: z.boolean(),
  smsThankYouReceiptEnabled: z.boolean(),
  emailThankYouReceiptEnabled: z.boolean(),
  smsPaymentConfirmedEnabled: z.boolean(),
  emailPaymentConfirmedEnabled: z.boolean(),
  /** One appointment block length (minutes); grid uses session + break. */
  bookingSessionMinutes: z.number().int().min(1).max(24 * 60),
  bookingBreakMinutes: z.number().int().min(0).max(24 * 60),
  /** Derived: session + break — minutes between consecutive slot starts. */
  bookingSlotStepMinutes: z.number().int().min(1).max(24 * 60),
  bookingConcurrentSeatsPerSlot: z.number().int().min(1).max(500),
});

export type SiteSettingsPublic = z.infer<typeof siteSettingsPublicSchema>;

const optionalTheme = themeTokensSchema.partial();

export const patchSiteSettingsSchema = z.object({
  businessName: z.string().min(1).max(256).optional(),
  addressLine1: z.string().max(512).optional(),
  city: z.string().max(128).optional(),
  region: z.string().max(64).optional(),
  postalCode: z.string().max(32).optional(),
  country: z.string().max(64).optional(),
  phone: z.string().max(64).optional(),
  publicEmail: z.string().max(256).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  openingHours: z.array(z.string()).optional(),
  bookingTimeZone: z.string().min(1).max(64).optional(),
  bookingHours: bookingHoursSpecSchema.optional(),
  defaultLocale: z.string().max(16).optional(),
  theme: optionalTheme.optional(),
  smsBookingNotificationsEnabled: z.boolean().optional(),
  emailBookingNotificationsEnabled: z.boolean().optional(),
  smsBookingRemindersEnabled: z.boolean().optional(),
  emailBookingRemindersEnabled: z.boolean().optional(),
  smsThankYouReceiptEnabled: z.boolean().optional(),
  emailThankYouReceiptEnabled: z.boolean().optional(),
  smsPaymentConfirmedEnabled: z.boolean().optional(),
  emailPaymentConfirmedEnabled: z.boolean().optional(),
  bookingSessionMinutes: z.number().int().min(1).max(24 * 60).optional(),
  bookingBreakMinutes: z.number().int().min(0).max(24 * 60).optional(),
  bookingConcurrentSeatsPerSlot: z.number().int().min(1).max(500).optional(),
});

export class PatchSiteSettingsBodyDto extends createZodDto(
  patchSiteSettingsSchema,
) {}
