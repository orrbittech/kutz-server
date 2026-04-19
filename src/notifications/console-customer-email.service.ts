import { Injectable, Logger } from '@nestjs/common';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';
import type { CustomerEmailService } from './customer-email.service.interface';

@Injectable()
export class ConsoleCustomerEmailService implements CustomerEmailService {
  private readonly logger = new Logger(ConsoleCustomerEmailService.name);

  async sendBookingConfirmed(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[Email stub] booking confirmed to ${to} code=${payload.bookingCode}`,
    );
  }

  async sendBookingReminder(
    to: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[Email stub] reminder ${kind} to ${to} booking ${payload.bookingId}`,
    );
  }

  async sendBookingThankYou(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    this.logger.log(
      `[Email stub] thank you to ${to} booking ${payload.bookingId}`,
    );
  }

  async sendBookingPaymentConfirmed(
    to: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void> {
    this.logger.log(
      `[Email stub] payment confirmed to ${to} booking ${payload.bookingId} ${payload.paymentStatus}`,
    );
  }
}
