import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Repository } from 'typeorm';
import { ClerkUsersService } from '../clerk/clerk-users.service';
import { BookingEntity } from '../database/entities/booking.entity';
import { BookingStatus } from '../domain/enums';
import type { BookingReminderKind } from '../notifications/booking-notification.types';
import { NotificationsFacade } from '../notifications/notifications.facade';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { persistBookingCodeIfMissing } from './booking-code.util';
import { buildBookingCustomerPayload } from './booking-customer-payload';
import { bookingSlotStepMs } from './booking-slot';

/** Half-width of the "due now" window for cron (1 min tick). */
const WINDOW_MS = 60_000;

@Injectable()
export class BookingRemindersService {
  private readonly logger = new Logger(BookingRemindersService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookings: Repository<BookingEntity>,
    private readonly siteSettings: SiteSettingsService,
    private readonly clerkUsers: ClerkUsersService,
    private readonly notifications: NotificationsFacade,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchReminders(): Promise<void> {
    const nowMs = Date.now();
    await this.processOffset(nowMs, '1h', 60 * 60_000);
    await this.processOffset(nowMs, '15m', 15 * 60_000);
  }

  private async processOffset(
    nowMs: number,
    kind: BookingReminderKind,
    offsetMs: number,
  ): Promise<void> {
    const flags = await this.siteSettings.getNotificationFlags();
    if (
      !flags.smsBookingRemindersEnabled &&
      !flags.emailBookingRemindersEnabled
    ) {
      return;
    }

    const publicSettings = await this.siteSettings.getPublic();
    const target = new Date(nowMs + offsetMs);
    const min = new Date(target.getTime() - WINDOW_MS);
    const max = new Date(target.getTime() + WINDOW_MS);

    const whereBase = {
      status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
      scheduledAt: Between(min, max),
    };

    const rows =
      kind === '1h'
        ? await this.bookings.find({
            where: { ...whereBase, reminder1hSentAt: IsNull() },
            relations: ['style', 'bookingStyles', 'bookingStyles.style'],
          })
        : await this.bookings.find({
            where: { ...whereBase, reminder15mSentAt: IsNull() },
            relations: ['style', 'bookingStyles', 'bookingStyles.style'],
          });

    for (const row of rows) {
      try {
        const contact = await this.clerkUsers.getContact(row.clerkUserId);
        const rowWithCode = await persistBookingCodeIfMissing(this.bookings, row);
        const payload = buildBookingCustomerPayload(
          rowWithCode,
          publicSettings.businessName,
          bookingSlotStepMs(publicSettings),
          publicSettings.bookingSessionMinutes,
        );
        await this.notifications.notifyBookingReminder(contact, kind, payload, {
          sms: flags.smsBookingRemindersEnabled,
          email: flags.emailBookingRemindersEnabled,
        });
        if (kind === '1h') {
          row.reminder1hSentAt = new Date();
        } else {
          row.reminder15mSentAt = new Date();
        }
        await this.bookings.save(row);
      } catch (err) {
        this.logger.error(
          `Reminder ${kind} failed for booking ${row.id}`,
          err as Error,
        );
      }
    }
  }
}
