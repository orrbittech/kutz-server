import { Injectable, Logger } from '@nestjs/common';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';
import type { SmsService } from './sms.service.interface';

@Injectable()
export class ConsoleSmsService implements SmsService {
  private readonly logger = new Logger(ConsoleSmsService.name);

  async sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void> {
    this.logger.log(
      `[SMS stub] booking for ${payload.clerkUserId} @ ${payload.scheduledAtIso} notes=${payload.hasNotes}`,
    );
  }

  async sendBookingConfirmedCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[SMS stub] booking confirmed to ${toE164} code=${payload.bookingCode}`,
    );
  }

  async sendBookingReminderCustomer(
    toE164: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[SMS stub] reminder ${kind} to ${toE164} booking ${payload.bookingId} @ ${payload.scheduledAtIso}`,
    );
  }

  async sendBookingThankYouCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[SMS stub] thank you to ${toE164} booking ${payload.bookingId}`,
    );
  }

  async sendBookingPaymentConfirmedCustomer(
    toE164: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void> {
    this.logger.log(
      `[SMS stub] payment confirmed to ${toE164} booking ${payload.bookingId} status=${payload.paymentStatus}`,
    );
  }
}
