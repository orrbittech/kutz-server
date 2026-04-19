import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { SiteSettingsEntity } from '../database/entities/site-settings.entity';
import type {
  PatchSiteSettingsBodyDto,
  SiteSettingsPublic,
  ThemeTokens,
} from './schemas/site-settings.zod';
import {
  bookingHoursSpecSchema,
  DEFAULT_BOOKING_HOURS,
  DEFAULT_BOOKING_TIME_ZONE,
  themeTokensSchema,
} from './schemas/site-settings.zod';

const SINGLETON_ID = 'default';

const DEFAULT_OPENING_HOURS = ['Mo-Su 07:00-20:00'];

const DEFAULT_SITE_ADDRESS = {
  addressLine1: '352 Van Heerden, Halfway Gardens',
  city: 'Midrand',
  region: 'Gauteng',
  postalCode: '1685',
  country: 'ZA',
  phone: '+27 00 000 0000',
  latitude: -25.995,
  longitude: 28.13,
} as const;

export const DEFAULT_THEME: ThemeTokens = {
  brandBrown: '#000000',
  brandCream: '#F5F5F5',
  brandOrange: '#1A1A1A',
  brandWhite: '#FFFFFF',
  background: '#FFFFFF',
  foreground: '#000000',
  primary: '#000000',
  muted: '#737373',
  card: '#FFFFFF',
  border: '#E5E5E5',
};

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(SiteSettingsEntity)
    private readonly repo: Repository<SiteSettingsEntity>,
  ) {}

  private shouldAudit(): boolean {
    if (this.config.get<string>('AUDIT_LOG') === 'true') return true;
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private auditLog(action: string, meta: Record<string, string>): void {
    if (!this.shouldAudit()) return;
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  private accessLog(action: string, meta: Record<string, string>): void {
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  private parseTheme(json: string): ThemeTokens {
    try {
      const raw = JSON.parse(json) as unknown;
      return themeTokensSchema.parse(raw);
    } catch {
      return DEFAULT_THEME;
    }
  }

  private parseHours(json: string): string[] {
    try {
      const raw = JSON.parse(json) as unknown;
      if (!Array.isArray(raw)) return [];
      return raw.filter((x): x is string => typeof x === 'string');
    } catch {
      return [];
    }
  }

  private parseBookingHoursSpec(json: string | undefined | null) {
    if (!json?.trim() || json.trim() === '[]') {
      return DEFAULT_BOOKING_HOURS;
    }
    try {
      const raw = JSON.parse(json) as unknown;
      return bookingHoursSpecSchema.parse(raw);
    } catch {
      return DEFAULT_BOOKING_HOURS;
    }
  }

  private mergeTheme(
    base: ThemeTokens,
    partial?: Partial<ThemeTokens>,
  ): ThemeTokens {
    return themeTokensSchema.parse({ ...base, ...partial });
  }

  /** Cached public settings; use for internal callers (no access log). */
  private async resolvePublic(): Promise<SiteSettingsPublic> {
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.siteSettingsPublic(),
      () => this.loadPublicUncached(),
      ttl,
    );
  }

  /** GET public/site-settings — logs each HTTP-backed read. */
  async getPublic(): Promise<SiteSettingsPublic> {
    this.accessLog('site_settings_get_public', {});
    return this.resolvePublic();
  }

  private async loadPublicUncached(): Promise<SiteSettingsPublic> {
    const row = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    const theme = row ? this.parseTheme(row.themeJson) : DEFAULT_THEME;
    const openingHours = row
      ? this.parseHours(row.openingHoursSpecJson)
      : DEFAULT_OPENING_HOURS;
    return {
      businessName: row?.businessName ?? 'Kutz',
      addressLine1: row?.addressLine1 ?? DEFAULT_SITE_ADDRESS.addressLine1,
      city: row?.city ?? DEFAULT_SITE_ADDRESS.city,
      region: row?.region ?? DEFAULT_SITE_ADDRESS.region,
      postalCode: row?.postalCode ?? DEFAULT_SITE_ADDRESS.postalCode,
      country: row?.country ?? DEFAULT_SITE_ADDRESS.country,
      phone: row?.phone ?? DEFAULT_SITE_ADDRESS.phone,
      publicEmail: row?.publicEmail ?? '',
      latitude:
        row?.latitude != null ? row.latitude : DEFAULT_SITE_ADDRESS.latitude,
      longitude:
        row?.longitude != null ? row.longitude : DEFAULT_SITE_ADDRESS.longitude,
      openingHours,
      bookingTimeZone: row?.bookingTimeZone?.trim()
        ? row.bookingTimeZone.trim()
        : DEFAULT_BOOKING_TIME_ZONE,
      bookingHours: row
        ? this.parseBookingHoursSpec(row.bookingHoursSpecJson)
        : DEFAULT_BOOKING_HOURS,
      defaultLocale: row?.defaultLocale ?? 'en',
      theme,
      smsBookingNotificationsEnabled:
        row?.smsBookingNotificationsEnabled ?? true,
      emailBookingNotificationsEnabled:
        row?.emailBookingNotificationsEnabled ?? true,
      smsBookingRemindersEnabled: row?.smsBookingRemindersEnabled ?? true,
      emailBookingRemindersEnabled: row?.emailBookingRemindersEnabled ?? true,
      smsThankYouReceiptEnabled: row?.smsThankYouReceiptEnabled ?? true,
      emailThankYouReceiptEnabled: row?.emailThankYouReceiptEnabled ?? true,
      smsPaymentConfirmedEnabled: row?.smsPaymentConfirmedEnabled ?? true,
      emailPaymentConfirmedEnabled: row?.emailPaymentConfirmedEnabled ?? true,
      bookingSessionMinutes: row?.bookingSessionMinutes ?? 15,
      bookingBreakMinutes: row?.bookingBreakMinutes ?? 10,
      bookingConcurrentSeatsPerSlot: row?.bookingConcurrentSeatsPerSlot ?? 5,
      bookingSlotStepMinutes:
        (row?.bookingSessionMinutes ?? 15) + (row?.bookingBreakMinutes ?? 10),
    };
  }

  async getNotificationFlags(): Promise<{
    smsBookingNotificationsEnabled: boolean;
    emailBookingNotificationsEnabled: boolean;
    smsBookingRemindersEnabled: boolean;
    emailBookingRemindersEnabled: boolean;
    smsThankYouReceiptEnabled: boolean;
    emailThankYouReceiptEnabled: boolean;
    smsPaymentConfirmedEnabled: boolean;
    emailPaymentConfirmedEnabled: boolean;
  }> {
    const p = await this.resolvePublic();
    return {
      smsBookingNotificationsEnabled: p.smsBookingNotificationsEnabled,
      emailBookingNotificationsEnabled: p.emailBookingNotificationsEnabled,
      smsBookingRemindersEnabled: p.smsBookingRemindersEnabled,
      emailBookingRemindersEnabled: p.emailBookingRemindersEnabled,
      smsThankYouReceiptEnabled: p.smsThankYouReceiptEnabled,
      emailThankYouReceiptEnabled: p.emailThankYouReceiptEnabled,
      smsPaymentConfirmedEnabled: p.smsPaymentConfirmedEnabled,
      emailPaymentConfirmedEnabled: p.emailPaymentConfirmedEnabled,
    };
  }

  async patch(
    input: PatchSiteSettingsBodyDto,
    actorClerkUserId?: string,
  ): Promise<SiteSettingsPublic> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const repo = qr.manager.getRepository(SiteSettingsEntity);
      let row = await repo.findOne({ where: { id: SINGLETON_ID } });
      if (!row) {
        row = repo.create({
          id: SINGLETON_ID,
          businessName: 'Kutz',
          addressLine1: DEFAULT_SITE_ADDRESS.addressLine1,
          city: DEFAULT_SITE_ADDRESS.city,
          region: DEFAULT_SITE_ADDRESS.region,
          postalCode: DEFAULT_SITE_ADDRESS.postalCode,
          country: DEFAULT_SITE_ADDRESS.country,
          phone: DEFAULT_SITE_ADDRESS.phone,
          publicEmail: '',
          latitude: DEFAULT_SITE_ADDRESS.latitude,
          longitude: DEFAULT_SITE_ADDRESS.longitude,
          openingHoursSpecJson: JSON.stringify(DEFAULT_OPENING_HOURS),
          bookingTimeZone: DEFAULT_BOOKING_TIME_ZONE,
          bookingHoursSpecJson: JSON.stringify(DEFAULT_BOOKING_HOURS),
          defaultLocale: 'en',
          themeJson: JSON.stringify(DEFAULT_THEME),
          smsBookingNotificationsEnabled: true,
          emailBookingNotificationsEnabled: true,
          smsBookingRemindersEnabled: true,
          emailBookingRemindersEnabled: true,
          smsThankYouReceiptEnabled: true,
          emailThankYouReceiptEnabled: true,
          smsPaymentConfirmedEnabled: true,
          emailPaymentConfirmedEnabled: true,
          bookingSessionMinutes: 15,
          bookingBreakMinutes: 10,
          bookingConcurrentSeatsPerSlot: 5,
        });
      }

      if (input.businessName !== undefined)
        row.businessName = input.businessName;
      if (input.addressLine1 !== undefined)
        row.addressLine1 = input.addressLine1;
      if (input.city !== undefined) row.city = input.city;
      if (input.region !== undefined) row.region = input.region;
      if (input.postalCode !== undefined) row.postalCode = input.postalCode;
      if (input.country !== undefined) row.country = input.country;
      if (input.phone !== undefined) row.phone = input.phone;
      if (input.publicEmail !== undefined) row.publicEmail = input.publicEmail;
      if (input.latitude !== undefined) row.latitude = input.latitude;
      if (input.longitude !== undefined) row.longitude = input.longitude;
      if (input.openingHours !== undefined) {
        row.openingHoursSpecJson = JSON.stringify(input.openingHours);
      }
      if (input.bookingTimeZone !== undefined) {
        row.bookingTimeZone = input.bookingTimeZone.trim();
      }
      if (input.bookingHours !== undefined) {
        row.bookingHoursSpecJson = JSON.stringify(
          bookingHoursSpecSchema.parse(input.bookingHours),
        );
      }
      if (input.defaultLocale !== undefined)
        row.defaultLocale = input.defaultLocale;
      if (input.smsBookingNotificationsEnabled !== undefined) {
        row.smsBookingNotificationsEnabled =
          input.smsBookingNotificationsEnabled;
      }
      if (input.emailBookingNotificationsEnabled !== undefined) {
        row.emailBookingNotificationsEnabled =
          input.emailBookingNotificationsEnabled;
      }
      if (input.smsBookingRemindersEnabled !== undefined) {
        row.smsBookingRemindersEnabled = input.smsBookingRemindersEnabled;
      }
      if (input.emailBookingRemindersEnabled !== undefined) {
        row.emailBookingRemindersEnabled = input.emailBookingRemindersEnabled;
      }
      if (input.smsThankYouReceiptEnabled !== undefined) {
        row.smsThankYouReceiptEnabled = input.smsThankYouReceiptEnabled;
      }
      if (input.emailThankYouReceiptEnabled !== undefined) {
        row.emailThankYouReceiptEnabled = input.emailThankYouReceiptEnabled;
      }
      if (input.smsPaymentConfirmedEnabled !== undefined) {
        row.smsPaymentConfirmedEnabled = input.smsPaymentConfirmedEnabled;
      }
      if (input.emailPaymentConfirmedEnabled !== undefined) {
        row.emailPaymentConfirmedEnabled = input.emailPaymentConfirmedEnabled;
      }
      if (input.bookingSessionMinutes !== undefined) {
        row.bookingSessionMinutes = input.bookingSessionMinutes;
      }
      if (input.bookingBreakMinutes !== undefined) {
        row.bookingBreakMinutes = input.bookingBreakMinutes;
      }
      if (input.bookingConcurrentSeatsPerSlot !== undefined) {
        row.bookingConcurrentSeatsPerSlot = input.bookingConcurrentSeatsPerSlot;
      }
      if (input.theme !== undefined) {
        const current = this.parseTheme(row.themeJson);
        row.themeJson = JSON.stringify(this.mergeTheme(current, input.theme));
      }

      await repo.save(row);
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }

    await this.cache.del(cacheKeys.siteSettingsPublic());
    if (actorClerkUserId !== undefined) {
      this.auditLog('site_settings_patched', { clerkUserId: actorClerkUserId });
    }
    return this.resolvePublic();
  }
}
