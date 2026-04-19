import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';
import type { CustomerEmailService } from './customer-email.service.interface';

@Injectable()
export class SendgridCustomerEmailService implements CustomerEmailService {
  private readonly logger = new Logger(SendgridCustomerEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendBookingConfirmed(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const code = payload.bookingCode?.trim() || payload.bookingId.slice(0, 8);
    const subject = `Booking confirmed — ${payload.businessName}`;
    const text = [
      `Your appointment at ${payload.businessName} is confirmed.`,
      ``,
      `When: ${payload.scheduledAtIso}`,
      `Services: ${payload.styleNames}`,
      `Booking Code: ${code}`,
      ``,
      `Receipt summary:`,
      payload.receiptSummaryText,
    ].join('\n');
    await this.send(to, subject, text);
  }

  async sendBookingReminder(
    to: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const when = kind === '1h' ? 'in 1 hour' : 'in 15 minutes';
    const subject = `${payload.businessName}: appointment ${when}`;
    const text = [
      `Hi — this is a reminder ${when}.`,
      ``,
      `When: ${payload.scheduledAtIso}`,
      `Services: ${payload.styleNames}`,
      ``,
      `Booking Code: ${payload.bookingCode?.trim() || payload.bookingId.slice(0, 8)}`,
    ].join('\n');
    await this.send(to, subject, text);
  }

  async sendBookingThankYou(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const subject = `Thank you — ${payload.businessName}`;
    const text = [
      `Thanks for visiting ${payload.businessName}.`,
      ``,
      `Appointment: ${payload.scheduledAtIso}`,
      `Services: ${payload.styleNames}`,
      ``,
      `Receipt summary:`,
      payload.receiptSummaryText,
      ``,
      `Booking Code: ${payload.bookingCode?.trim() || payload.bookingId.slice(0, 8)}`,
    ].join('\n');
    await this.send(to, subject, text);
  }

  async sendBookingPaymentConfirmed(
    to: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void> {
    const subject = `Payment received — ${payload.businessName}`;
    const text = [
      `We received your payment for ${payload.businessName}.`,
      ``,
      `Appointment: ${payload.scheduledAtIso}`,
      `Services: ${payload.styleNames}`,
      `Payment status: ${payload.paymentStatus}`,
      `Total paid: R ${(payload.amountPaidCents / 100).toFixed(2)}`,
      `Total due: R ${(payload.totalDueCents / 100).toFixed(2)}`,
      `Outstanding: R ${(payload.outstandingCents / 100).toFixed(2)}`,
      ``,
      `Receipt summary:`,
      payload.receiptSummaryText,
      ``,
      `Booking Code: ${payload.bookingCode?.trim() || payload.bookingId.slice(0, 8)}`,
    ].join('\n');
    await this.send(to, subject, text);
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');
    if (!apiKey || !from) {
      this.logger.warn(
        'SendGrid customer email skipped: SENDGRID_API_KEY or EMAIL_FROM missing',
      );
      return;
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{ type: 'text/plain', value: text }],
        }),
      });
      if (!res.ok) {
        this.logger.error(`SendGrid error ${res.status}: ${await res.text()}`);
        return;
      }
      this.logger.log(`SendGrid customer email sent to ${to}`);
    } catch (err) {
      this.logger.error('SendGrid customer email failed', err as Error);
    }
  }
}
