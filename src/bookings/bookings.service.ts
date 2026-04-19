import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { ClerkUsersService } from '../clerk/clerk-users.service';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { BookingEntity } from '../database/entities/booking.entity';
import { BookingStyleEntity } from '../database/entities/booking-style.entity';
import { StyleEntity } from '../database/entities/style.entity';
import { BookingPaymentStatus, BookingStatus } from '../domain/enums';
import { NotificationsFacade } from '../notifications/notifications.facade';
import type { SiteSettingsPublic } from '../site-settings/schemas/site-settings.zod';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import type { ClerkRequestUser } from '../auth/clerk-user.types';
import { StripeService } from '../stripe/stripe.service';
import {
  bookingRequiresCardPayment,
  STRIPE_MIN_ZAR_CHARGE_CENTS,
  sumStylePricesCents,
} from './booking-payment.util';
import {
  buildBookingCustomerPayload,
  buildBookingPaymentConfirmedPayload,
} from './booking-customer-payload';
import {
  isSlotStartInPast,
  isValidBookableInstant,
} from './booking-hours.util';
import {
  generateBookingCode,
  persistBookingCodeIfMissing,
} from './booking-code.util';
import {
  bookingSlotStepMs,
  floorToSlotUtc,
  slotSpanForStyleMinutes,
} from './booking-slot';
import type {
  BookingPaymentIntentResponse,
  BookingOccupancyResponse,
  BookingResponse,
} from './schemas/booking.zod';
import type Stripe from 'stripe';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    private readonly notifications: NotificationsFacade,
    private readonly siteSettings: SiteSettingsService,
    private readonly stripe: StripeService,
    private readonly clerkUsers: ClerkUsersService,
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

  private isPgUniqueViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err as { driverError?: { code?: string } }).driverError?.code === '23505'
    );
  }

  /** Ensures legacy rows get a persisted code (lazy backfill). */
  private async ensureBookingCode(row: BookingEntity): Promise<BookingEntity> {
    return persistBookingCodeIfMissing(this.bookings, row);
  }

  private async finalizeResponse(
    row: BookingEntity | null | undefined,
  ): Promise<BookingResponse> {
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    const ensured = await this.ensureBookingCode(row);
    return this.toResponse(ensured);
  }

  /** Counts bookings whose duration-span covers this aligned slot start for a style. */
  private async countStyleOccupancyAtSlot(
    manager: EntityManager,
    styleId: string,
    targetSlotStartUtc: Date,
    publicSettings: SiteSettingsPublic,
    excludeBookingId: string | undefined,
  ): Promise<number> {
    const stepMs = bookingSlotStepMs(publicSettings);
    const slotStepMin = publicSettings.bookingSlotStepMinutes;
    const sessionMin = publicSettings.bookingSessionMinutes;
    const targetMs = targetSlotStartUtc.getTime();
    const rows = await manager.query<{ c: string | number }[]>(
      `
      SELECT COUNT(DISTINCT b.id)::int AS c
      FROM bookings b
      INNER JOIN booking_styles bs ON bs."bookingId" = b.id
      INNER JOIN styles st ON st.id = bs."styleId"
      WHERE bs."styleId" = $1
        AND b.status IN ($2, $3)
        AND ($4::uuid IS NULL OR b.id <> $4::uuid)
        AND $5::bigint >= (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / $6::bigint) * $6::bigint)
        AND $5::bigint < (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / $6::bigint) * $6::bigint)
          + (GREATEST(1, CEIL(COALESCE(st."durationMinutes", $7)::numeric / $8::numeric))::bigint * $6::bigint)
        AND (
          ($5::bigint - (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / $6::bigint) * $6::bigint))
            % $6::bigint = 0
        )
      `,
      [
        styleId,
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        excludeBookingId ?? null,
        String(targetMs),
        String(stepMs),
        sessionMin,
        slotStepMin,
      ],
    );
    const c = rows[0]?.c;
    return typeof c === 'string' ? Number(c) : (c ?? 0);
  }

  private parseSucceededPaymentIntentIds(
    raw: string | null | undefined,
  ): Set<string> {
    if (!raw?.trim()) return new Set();
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  private resolveTotalDueCents(row: BookingEntity): number {
    const styles = this.bookingStyleEntities(row);
    return row.totalDueCents ?? sumStylePricesCents(styles);
  }

  private computeOutstandingCents(row: BookingEntity): number {
    const total = this.resolveTotalDueCents(row);
    const paid = row.amountPaidCents ?? 0;
    return Math.max(0, total - paid);
  }

  /** Updates payment fields from current style prices and paid amount (e.g. after editing services). */
  private applyPricingFromStyles(
    row: BookingEntity,
    styles: StyleEntity[],
  ): void {
    const total = sumStylePricesCents(styles);
    row.totalDueCents = total;
    if (!bookingRequiresCardPayment(total)) {
      row.paymentStatus = BookingPaymentStatus.NOT_REQUIRED;
      row.status = BookingStatus.CONFIRMED;
      row.amountPaidCents = 0;
      return;
    }
    const paid = row.amountPaidCents ?? 0;
    if (paid >= total) {
      row.paymentStatus = BookingPaymentStatus.PAID;
      row.status = BookingStatus.CONFIRMED;
    } else if (paid > 0) {
      row.paymentStatus = BookingPaymentStatus.PARTIAL;
      if (row.status !== BookingStatus.CANCELLED) {
        row.status = BookingStatus.PENDING;
      }
    } else {
      row.paymentStatus = BookingPaymentStatus.UNPAID;
      if (row.status !== BookingStatus.CANCELLED) {
        row.status = BookingStatus.PENDING;
      }
    }
  }

  /** Floors to slot, validates shop hours grid, rejects past slots. */
  private assertScheduleAllowed(
    publicSettings: SiteSettingsPublic,
    scheduledAtRaw: Date,
  ): Date {
    const slotStepMs = bookingSlotStepMs(publicSettings);
    const scheduledAt = floorToSlotUtc(scheduledAtRaw, slotStepMs);
    if (
      !isValidBookableInstant(
        publicSettings.bookingTimeZone,
        publicSettings.bookingHours,
        scheduledAtRaw,
        publicSettings.bookingSlotStepMinutes,
        slotStepMs,
      )
    ) {
      throw new BadRequestException(
        'Pick a time within shop opening hours on a valid bookable slot.',
      );
    }
    if (isSlotStartInPast(new Date(), scheduledAt)) {
      throw new BadRequestException(
        'That time has already passed. Pick a future slot.',
      );
    }
    return scheduledAt;
  }

  async listForActor(user: ClerkRequestUser): Promise<BookingResponse[]> {
    if (user.isAdmin) {
      this.accessLog('bookings_list', {
        clerkUserId: user.clerkUserId,
        scope: 'all',
      });
      const rows = await this.bookings.find({
        relations: ['style', 'bookingStyles', 'bookingStyles.style'],
        order: { createdAt: 'DESC' },
      });
      return Promise.all(rows.map((row) => this.finalizeResponse(row)));
    }
    return this.listForUser(user.clerkUserId);
  }

  async listForUser(clerkUserId: string): Promise<BookingResponse[]> {
    this.accessLog('bookings_list', { clerkUserId, scope: 'own' });
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.bookingsList(clerkUserId),
      async () => {
        const rows = await this.bookings.find({
          where: { clerkUserId },
          relations: ['style', 'bookingStyles', 'bookingStyles.style'],
          order: { createdAt: 'DESC' },
        });
        return Promise.all(rows.map((row) => this.finalizeResponse(row)));
      },
      ttl,
    );
  }

  async getOccupancyForRange(
    from: Date,
    to: Date,
    styleIds: string[],
  ): Promise<BookingOccupancyResponse> {
    this.accessLog('bookings_get_occupancy', {
      from: from.toISOString(),
      to: to.toISOString(),
      styleIds: styleIds.join(','),
    });
    if (styleIds.length < 1) {
      return { slots: [] };
    }
    const publicSettings = await this.siteSettings.getPublic();
    const stepMs = bookingSlotStepMs(publicSettings);
    const slotStepMin = publicSettings.bookingSlotStepMinutes;
    const sessionMin = publicSettings.bookingSessionMinutes;
    const fromMs = from.getTime();
    const toMs = to.getTime();

    const raw = await this.dataSource.query<
      {
        scheduledAt: string | Date;
        styleId: string;
        durationMinutes: string | null;
      }[]
    >(
      `
      SELECT b."scheduledAt" AS "scheduledAt", bs."styleId" AS "styleId",
             st."durationMinutes" AS "durationMinutes"
      FROM bookings b
      INNER JOIN booking_styles bs ON bs."bookingId" = b.id
      INNER JOIN styles st ON st.id = bs."styleId"
      WHERE b.status IN ($1, $2)
        AND bs."styleId" = ANY($3::uuid[])
        AND (
          (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / $4::bigint) * $4::bigint)
          + (GREATEST(1, CEIL(COALESCE(st."durationMinutes", $5)::numeric / $6::numeric))::bigint * $4::bigint)
          > $7::bigint
        )
        AND (((extract(epoch FROM b."scheduledAt") * 1000)::bigint / $4::bigint) * $4::bigint) < $8::bigint
      `,
      [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        styleIds,
        String(stepMs),
        sessionMin,
        slotStepMin,
        String(fromMs),
        String(toMs),
      ],
    );

    const bySlot = new Map<string, Record<string, number>>();
    for (const r of raw) {
      const scheduledAt = new Date(r.scheduledAt);
      const styleId = r.styleId;
      const durMin =
        r.durationMinutes != null && r.durationMinutes !== ''
          ? Number(r.durationMinutes)
          : sessionMin;
      const span = slotSpanForStyleMinutes(durMin, slotStepMin);
      const floorStart = floorToSlotUtc(scheduledAt, stepMs);
      for (let i = 0; i < span; i++) {
        const slot = new Date(floorStart.getTime() + i * stepMs);
        const t = slot.getTime();
        if (t < fromMs || t >= toMs) {
          continue;
        }
        const slotStart = slot.toISOString();
        const cur = bySlot.get(slotStart) ?? {};
        cur[styleId] = (cur[styleId] ?? 0) + 1;
        bySlot.set(slotStart, cur);
      }
    }
    const slots = [...bySlot.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([slotStart, byStyleId]) => ({ slotStart, byStyleId }));
    return { slots };
  }

  async createForUser(
    clerkUserId: string,
    input: { scheduledAt: string; notes?: string; styleIds: string[] },
  ): Promise<BookingResponse> {
    const seen = new Set<string>();
    const orderedUniqueIds: string[] = [];
    for (const id of input.styleIds) {
      if (!seen.has(id)) {
        seen.add(id);
        orderedUniqueIds.push(id);
      }
    }

    this.accessLog('bookings_create_for_user', {
      clerkUserId,
      styleIds: orderedUniqueIds.join(','),
      scheduledAt: input.scheduledAt,
    });
    const publicSettings = await this.siteSettings.getPublic();
    const scheduledAt = this.assertScheduleAllowed(
      publicSettings,
      new Date(input.scheduledAt),
    );
    const notesPlain = input.notes?.trim() ?? '';

    let needsCardPayment = false;
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let saved: BookingEntity;
    try {
      const repo = qr.manager.getRepository(BookingEntity);
      const styleRepo = qr.manager.getRepository(StyleEntity);
      const linkRepo = qr.manager.getRepository(BookingStyleEntity);

      const orderedStyles: StyleEntity[] = [];
      for (const styleId of orderedUniqueIds) {
        const style = await styleRepo.findOne({
          where: { id: styleId, isActive: true },
        });
        if (!style) {
          throw new BadRequestException('Invalid or inactive style.');
        }
        orderedStyles.push(style);
      }

      const primaryStyle = orderedStyles[0];
      const totalCents = sumStylePricesCents(orderedStyles);
      needsCardPayment = bookingRequiresCardPayment(totalCents);

      const slotStepMs = bookingSlotStepMs(publicSettings);
      const slotStepMin = publicSettings.bookingSlotStepMinutes;
      const sessionMin = publicSettings.bookingSessionMinutes;
      const seats = publicSettings.bookingConcurrentSeatsPerSlot;
      const floorSlot = floorToSlotUtc(scheduledAt, slotStepMs);
      for (const style of orderedStyles) {
        const durMin = style.durationMinutes ?? sessionMin;
        const span = slotSpanForStyleMinutes(durMin, slotStepMin);
        for (let i = 0; i < span; i++) {
          const slotStart = new Date(floorSlot.getTime() + i * slotStepMs);
          const used = await this.countStyleOccupancyAtSlot(
            qr.manager,
            style.id,
            slotStart,
            publicSettings,
            undefined,
          );
          if (used >= seats) {
            throw new ConflictException(
              'This time slot is no longer available. Pick another date or time.',
            );
          }
        }
      }
      const row = repo.create({
        clerkUserId,
        scheduledAt,
        status: needsCardPayment
          ? BookingStatus.PENDING
          : BookingStatus.CONFIRMED,
        notes: notesPlain,
        style: primaryStyle,
        totalDueCents: totalCents,
        amountPaidCents: needsCardPayment ? 0 : 0,
        paymentStatus: needsCardPayment
          ? BookingPaymentStatus.UNPAID
          : BookingPaymentStatus.NOT_REQUIRED,
        stripeSucceededPaymentIntentIds: '',
        paymentConfirmationSentAt: null,
      });
      saved = await (async (): Promise<BookingEntity> => {
        for (let attempt = 0; attempt < 24; attempt++) {
          row.bookingCode = generateBookingCode();
          try {
            return await repo.save(row);
          } catch (err) {
            if (!this.isPgUniqueViolation(err)) {
              throw err;
            }
          }
        }
        throw new ConflictException(
          'Could not allocate a booking code. Try again.',
        );
      })();

      for (const s of orderedStyles) {
        await linkRepo.insert({
          bookingId: saved.id,
          styleId: s.id,
        });
      }

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }

    await this.cache.del(cacheKeys.bookingsList(clerkUserId));
    const withRelations = await this.bookings.findOne({
      where: { id: saved.id },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    const rowForNotify = withRelations ?? saved;
    const withCode = await persistBookingCodeIfMissing(
      this.bookings,
      rowForNotify,
    );
    if (!needsCardPayment) {
      const flags = await this.siteSettings.getNotificationFlags();
      await this.notifications.notifyBookingCreated(
        {
          clerkUserId,
          scheduledAtIso: saved.scheduledAt.toISOString(),
          hasNotes: notesPlain.length > 0,
        },
        {
          sms: flags.smsBookingNotificationsEnabled,
          email: flags.emailBookingNotificationsEnabled,
        },
      );
      const contact = await this.clerkUsers.getContact(clerkUserId);
      const publicSettings = await this.siteSettings.getPublic();
      const customerPayload = buildBookingCustomerPayload(
        withCode,
        publicSettings.businessName,
        bookingSlotStepMs(publicSettings),
        publicSettings.bookingSessionMinutes,
      );
      await this.notifications.notifyBookingConfirmedToCustomer(
        contact,
        customerPayload,
        {
          sms: flags.smsBookingNotificationsEnabled,
          email: flags.emailBookingNotificationsEnabled,
        },
      );
    }
    this.auditLog('booking_created', {
      bookingId: saved.id,
      clerkUserId,
      scheduledAt: saved.scheduledAt.toISOString(),
    });
    return await this.finalizeResponse(withCode);
  }

  async updateForUser(
    clerkUserId: string,
    bookingId: string,
    input: { scheduledAt?: string; notes?: string; styleIds?: string[] },
  ): Promise<BookingResponse> {
    this.accessLog('bookings_update_for_user', {
      clerkUserId,
      bookingId,
      hasScheduledAt: String(input.scheduledAt !== undefined),
      hasNotes: String(input.notes !== undefined),
      hasStyleIds: String(input.styleIds !== undefined),
    });
    const pre = await this.bookings.findOne({
      where: { id: bookingId, clerkUserId },
    });
    if (!pre) {
      throw new NotFoundException('Booking not found');
    }
    if (
      pre.status === BookingStatus.CANCELLED ||
      pre.status === BookingStatus.SERVICED
    ) {
      throw new BadRequestException('This booking cannot be changed.');
    }

    let nextScheduled = pre.scheduledAt;
    if (input.scheduledAt !== undefined) {
      const publicSettings = await this.siteSettings.getPublic();
      nextScheduled = this.assertScheduleAllowed(
        publicSettings,
        new Date(input.scheduledAt),
      );
    }
    const notesPlain =
      input.notes !== undefined ? input.notes.trim() : (pre.notes ?? '');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const repo = qr.manager.getRepository(BookingEntity);
      const styleRepo = qr.manager.getRepository(StyleEntity);
      const linkRepo = qr.manager.getRepository(BookingStyleEntity);
      const existing = await repo.findOne({
        where: { id: bookingId, clerkUserId },
      });
      if (!existing) {
        throw new NotFoundException('Booking not found');
      }
      const capacityStyleIds: string[] = [];
      if (input.styleIds !== undefined) {
        const seen = new Set<string>();
        for (const id of input.styleIds) {
          if (!seen.has(id)) {
            seen.add(id);
            capacityStyleIds.push(id);
          }
        }
      } else {
        const links = await linkRepo.find({
          where: { bookingId },
          select: ['styleId'],
        });
        capacityStyleIds.push(...links.map((l) => l.styleId));
      }
      const publicForSlot = await this.siteSettings.getPublic();
      const slotStepMs = bookingSlotStepMs(publicForSlot);
      const slotStepMin = publicForSlot.bookingSlotStepMinutes;
      const sessionMin = publicForSlot.bookingSessionMinutes;
      const floorSlot = floorToSlotUtc(nextScheduled, slotStepMs);
      const seats = publicForSlot.bookingConcurrentSeatsPerSlot;

      const capacityStyles: StyleEntity[] = [];
      if (input.styleIds !== undefined) {
        for (const sid of capacityStyleIds) {
          const style = await styleRepo.findOne({
            where: { id: sid, isActive: true },
          });
          if (!style) {
            throw new BadRequestException('Invalid or inactive style.');
          }
          capacityStyles.push(style);
        }
      } else {
        for (const sid of capacityStyleIds) {
          const style = await styleRepo.findOne({ where: { id: sid } });
          if (!style) {
            throw new BadRequestException('Invalid or inactive style.');
          }
          capacityStyles.push(style);
        }
      }

      for (const style of capacityStyles) {
        const durMin = style.durationMinutes ?? sessionMin;
        const span = slotSpanForStyleMinutes(durMin, slotStepMin);
        for (let i = 0; i < span; i++) {
          const slotStart = new Date(floorSlot.getTime() + i * slotStepMs);
          const used = await this.countStyleOccupancyAtSlot(
            qr.manager,
            style.id,
            slotStart,
            publicForSlot,
            bookingId,
          );
          if (used >= seats) {
            throw new ConflictException(
              'This time slot is no longer available. Pick another date or time.',
            );
          }
        }
      }
      if (
        input.scheduledAt !== undefined &&
        nextScheduled.getTime() !== existing.scheduledAt.getTime()
      ) {
        existing.reminder1hSentAt = null;
        existing.reminder15mSentAt = null;
        existing.thankYouSentAt = null;
      }
      existing.scheduledAt = nextScheduled;
      existing.notes = notesPlain;

      if (input.styleIds !== undefined) {
        const primaryStyle = capacityStyles[0];
        await linkRepo.delete({ bookingId: existing.id });
        for (const s of capacityStyles) {
          await linkRepo.insert({
            bookingId: existing.id,
            styleId: s.id,
          });
        }
        existing.style = primaryStyle;
        this.applyPricingFromStyles(existing, capacityStyles);
      }

      await repo.save(existing);
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }

    await this.cache.del(cacheKeys.bookingsList(clerkUserId));
    const fresh = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    return await this.finalizeResponse(fresh);
  }

  async completeBookingForAdmin(bookingId: string): Promise<BookingResponse> {
    const row = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (row.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking cannot be completed.');
    }
    if (row.status === BookingStatus.SERVICED && row.thankYouSentAt) {
      const fresh = await this.bookings.findOne({
        where: { id: bookingId },
        relations: ['style', 'bookingStyles', 'bookingStyles.style'],
      });
      return await this.finalizeResponse(fresh);
    }

    if (row.status !== BookingStatus.SERVICED) {
      row.status = BookingStatus.SERVICED;
      await this.bookings.save(row);
      await this.cache.del(cacheKeys.bookingsList(row.clerkUserId));
    }

    if (!row.thankYouSentAt) {
      const publicSettings = await this.siteSettings.getPublic();
      const flags = await this.siteSettings.getNotificationFlags();
      const contact = await this.clerkUsers.getContact(row.clerkUserId);
      const rowWithCode = await persistBookingCodeIfMissing(this.bookings, row);
      const payload = buildBookingCustomerPayload(
        rowWithCode,
        publicSettings.businessName,
        bookingSlotStepMs(publicSettings),
        publicSettings.bookingSessionMinutes,
      );
      await this.notifications.notifyBookingThankYou(contact, payload, {
        sms: flags.smsThankYouReceiptEnabled,
        email: flags.emailThankYouReceiptEnabled,
      });
      rowWithCode.thankYouSentAt = new Date();
      await this.bookings.save(rowWithCode);
      await this.cache.del(cacheKeys.bookingsList(rowWithCode.clerkUserId));
    }

    const fresh = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    return await this.finalizeResponse(fresh);
  }

  async cancelForUser(
    clerkUserId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    this.accessLog('bookings_cancel_for_user', { clerkUserId, bookingId });
    const row = await this.bookings.findOne({
      where: { id: bookingId, clerkUserId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (row.status === BookingStatus.CANCELLED) {
      return await this.finalizeResponse(row);
    }
    if (row.status === BookingStatus.SERVICED) {
      throw new BadRequestException('This booking cannot be cancelled.');
    }
    row.status = BookingStatus.CANCELLED;
    await this.bookings.save(row);
    await this.cache.del(cacheKeys.bookingsList(clerkUserId));
    const fresh = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    return await this.finalizeResponse(fresh);
  }

  async createPaymentIntentForBooking(
    clerkUserId: string,
    bookingId: string,
  ): Promise<BookingPaymentIntentResponse> {
    const stripe = this.stripe.requireClient();
    const row = await this.bookings.findOne({
      where: { id: bookingId, clerkUserId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (
      row.status !== BookingStatus.PENDING &&
      row.paymentStatus !== BookingPaymentStatus.PARTIAL
    ) {
      throw new BadRequestException(
        'Payment can only be collected for bookings with an outstanding balance.',
      );
    }
    const styleEntities = this.bookingStyleEntities(row);
    const totalDue = this.resolveTotalDueCents(row);
    if (!bookingRequiresCardPayment(totalDue)) {
      throw new BadRequestException(
        'This booking does not require online card payment.',
      );
    }
    const outstanding = this.computeOutstandingCents(row);
    if (outstanding <= 0) {
      throw new BadRequestException('This booking is already paid in full.');
    }
    if (outstanding < STRIPE_MIN_ZAR_CHARGE_CENTS) {
      throw new BadRequestException(
        'Outstanding balance is below the minimum card charge.',
      );
    }

    if (row.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(
        row.stripePaymentIntentId,
      );
      if (existing.status === 'succeeded') {
        row.stripePaymentIntentId = null;
        await this.bookings.save(row);
        await this.cache.del(cacheKeys.bookingsList(clerkUserId));
      } else {
        const payable = new Set([
          'requires_payment_method',
          'requires_confirmation',
          'requires_action',
          'processing',
        ]);
        if (
          payable.has(existing.status) &&
          existing.client_secret &&
          existing.amount === outstanding
        ) {
          return {
            clientSecret: existing.client_secret,
            amountCents: outstanding,
            currency: 'zar',
          };
        }
      }
    }

    const pi = await stripe.paymentIntents.create({
      amount: outstanding,
      currency: 'zar',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: row.id,
        clerkUserId: row.clerkUserId,
      },
    });
    if (!pi.client_secret) {
      throw new BadRequestException('Could not start payment session.');
    }
    row.stripePaymentIntentId = pi.id;
    row.paymentAmountCents = outstanding;
    await this.bookings.save(row);
    await this.cache.del(cacheKeys.bookingsList(clerkUserId));

    return {
      clientSecret: pi.client_secret,
      amountCents: outstanding,
      currency: 'zar',
    };
  }

  /**
   * After Stripe.js confirms payment, sync DB by retrieving the PaymentIntent and
   * applying the same logic as the webhook (idempotent per PI id).
   */
  async syncPaymentFromStripeForUser(
    clerkUserId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    this.accessLog('bookings_sync_payment_from_stripe', {
      clerkUserId,
      bookingId,
    });
    const row = await this.bookings.findOne({
      where: { id: bookingId, clerkUserId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!row) {
      throw new NotFoundException('Booking not found');
    }
    if (row.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('This booking cannot be updated.');
    }
    if (!row.stripePaymentIntentId?.trim()) {
      throw new BadRequestException(
        'No payment session is associated with this booking.',
      );
    }
    const stripe = this.stripe.requireClient();
    const pi = await stripe.paymentIntents.retrieve(row.stripePaymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new ConflictException(
        `Payment is not complete yet (status: ${pi.status}).`,
      );
    }
    await this.applyPaymentIntentSucceeded(pi);
    const fresh = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!fresh) {
      throw new NotFoundException('Booking not found');
    }
    return await this.finalizeResponse(fresh);
  }

  async applyPaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
    const bookingId = pi.metadata?.bookingId;
    const clerkMeta = pi.metadata?.clerkUserId;
    if (!bookingId || !clerkMeta) {
      this.logger.warn('payment_intent.succeeded missing booking metadata');
      return;
    }
    const row = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!row) {
      this.logger.warn(`payment for unknown booking ${bookingId}`);
      return;
    }
    if (row.clerkUserId !== clerkMeta) {
      this.logger.warn(`payment clerk mismatch for booking ${bookingId}`);
      return;
    }
    if (row.status === BookingStatus.CANCELLED) {
      return;
    }
    if (row.paymentStatus === BookingPaymentStatus.NOT_REQUIRED) {
      return;
    }
    const succeededIds = this.parseSucceededPaymentIntentIds(
      row.stripeSucceededPaymentIntentIds,
    );
    if (succeededIds.has(pi.id)) {
      return;
    }
    const received = pi.amount_received ?? pi.amount;
    const totalDue = this.resolveTotalDueCents(row);
    row.amountPaidCents = (row.amountPaidCents ?? 0) + received;
    succeededIds.add(pi.id);
    row.stripeSucceededPaymentIntentIds = [...succeededIds].join(',');
    row.stripePaymentIntentId = pi.id;
    row.paymentAmountCents = received;
    const outstanding = Math.max(0, totalDue - (row.amountPaidCents ?? 0));
    if ((row.amountPaidCents ?? 0) >= totalDue) {
      row.paymentStatus = BookingPaymentStatus.PAID;
      row.status = BookingStatus.CONFIRMED;
    } else {
      row.paymentStatus = BookingPaymentStatus.PARTIAL;
      row.status = BookingStatus.PENDING;
    }
    await this.bookings.save(row);
    await this.cache.del(cacheKeys.bookingsList(row.clerkUserId));
    const reloaded = await this.bookings.findOne({
      where: { id: row.id },
      relations: ['style', 'bookingStyles', 'bookingStyles.style'],
    });
    if (!reloaded) {
      this.logger.warn(`payment reload failed for booking ${row.id}`);
      return;
    }
    const withCode = await persistBookingCodeIfMissing(this.bookings, reloaded);
    const flags = await this.siteSettings.getNotificationFlags();
    await this.notifications.notifyBookingCreated(
      {
        clerkUserId: withCode.clerkUserId,
        scheduledAtIso: withCode.scheduledAt.toISOString(),
        hasNotes: (withCode.notes ?? '').length > 0,
      },
      {
        sms: flags.smsBookingNotificationsEnabled,
        email: flags.emailBookingNotificationsEnabled,
      },
    );
    const publicSettings = await this.siteSettings.getPublic();
    const contact = await this.clerkUsers.getContact(withCode.clerkUserId);
    const paymentPayload = buildBookingPaymentConfirmedPayload(
      withCode,
      publicSettings.businessName,
      bookingSlotStepMs(publicSettings),
      publicSettings.bookingSessionMinutes,
      {
        amountPaidCents: withCode.amountPaidCents ?? 0,
        totalDueCents: totalDue,
        outstandingCents: outstanding,
        paymentStatus: withCode.paymentStatus,
      },
    );
    await this.notifications.notifyBookingPaymentConfirmed(
      contact,
      paymentPayload,
      {
        sms: flags.smsPaymentConfirmedEnabled,
        email: flags.emailPaymentConfirmedEnabled,
      },
    );
    withCode.paymentConfirmationSentAt = new Date();
    await this.bookings.save(withCode);
    this.auditLog('booking_payment_succeeded', {
      bookingId: row.id,
      clerkUserId: row.clerkUserId,
    });
  }

  private bookingStyleEntities(row: BookingEntity): StyleEntity[] {
    const fromLinks =
      row.bookingStyles
        ?.filter((l): l is typeof l & { style: StyleEntity } =>
          Boolean(l.style),
        )
        .map((l) => l.style) ?? [];
    if (fromLinks.length > 0) {
      return fromLinks;
    }
    return row.style ? [row.style] : [];
  }

  private styleToSummary(style: StyleEntity | null): BookingResponse['style'] {
    if (!style) return null;
    return {
      id: style.id,
      name: style.name,
      description: style.description,
      imageUrl: style.imageUrl,
      priceCents: style.priceCents,
      durationMinutes: style.durationMinutes ?? null,
      category: style.category,
    };
  }

  private stylesForResponse(row: BookingEntity): BookingResponse['styles'] {
    const fromLinks: NonNullable<BookingResponse['style']>[] =
      row.bookingStyles
        ?.filter((l): l is typeof l & { style: StyleEntity } =>
          Boolean(l.style),
        )
        .map((l) => this.styleToSummary(l.style)!) ?? [];
    if (fromLinks.length > 0) {
      return [...fromLinks].sort((a, b) => a.name.localeCompare(b.name));
    }
    const single = this.styleToSummary(row.style ?? null);
    return single ? [single] : [];
  }

  private toResponse(row: BookingEntity): BookingResponse {
    const notes = row.notes ?? '';
    const styles = this.stylesForResponse(row);
    const styleId = styles[0]?.id ?? row.style?.id ?? null;
    const styleName =
      styles.length > 0
        ? styles.map((s) => s.name).join(' · ')
        : (row.style?.name ?? null);
    const style = styles[0] ?? this.styleToSummary(row.style ?? null);
    const totalDue = this.resolveTotalDueCents(row);
    const outstanding = this.computeOutstandingCents(row);
    const paymentStatus =
      row.paymentStatus ??
      (() => {
        if (!bookingRequiresCardPayment(totalDue)) {
          return BookingPaymentStatus.NOT_REQUIRED;
        }
        if (row.status === BookingStatus.CONFIRMED) {
          return BookingPaymentStatus.PAID;
        }
        return BookingPaymentStatus.UNPAID;
      })();
    return {
      id: row.id,
      bookingCode: row.bookingCode ?? '',
      clerkUserId: row.clerkUserId,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      notes,
      styleId,
      styleName,
      style,
      styles,
      stripePaymentIntentId: row.stripePaymentIntentId ?? null,
      paymentAmountCents: row.paymentAmountCents ?? null,
      paymentStatus,
      totalDueCents: totalDue,
      amountPaidCents: row.amountPaidCents ?? 0,
      outstandingCents: outstanding,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
