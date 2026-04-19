import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';
import type { SmsService } from './sms.service.interface';

@Injectable()
export class TwilioSmsService implements SmsService {
  private readonly logger = new Logger(TwilioSmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void> {
    const body = `Kutz: booking scheduled ${payload.scheduledAtIso}. User ${payload.clerkUserId}.`;
    await this.sendToAdminNumber(body);
  }

  async sendBookingConfirmedCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const code = payload.bookingCode?.trim() || payload.bookingId.slice(0, 8);
    const body = `${payload.businessName}: booking confirmed — ${payload.styleNames} at ${payload.scheduledAtIso}. Code ${code}. Show this at the shop.`;
    await this.sendToCustomer(toE164, body);
  }

  async sendBookingReminderCustomer(
    toE164: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const when = kind === '1h' ? 'in 1 hour' : 'in 15 minutes';
    const code = payload.bookingCode?.trim() || payload.bookingId.slice(0, 8);
    const body = `${payload.businessName}: reminder — ${when}. ${payload.styleNames} at ${payload.scheduledAtIso}. Code ${code}`;
    await this.sendToCustomer(toE164, body);
  }

  async sendBookingThankYouCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void> {
    const code = payload.bookingCode?.trim() || payload.bookingId.slice(0, 8);
    const body = `${payload.businessName}: thank you for visiting! Details by email. Code ${code}`;
    await this.sendToCustomer(toE164, body);
  }

  async sendBookingPaymentConfirmedCustomer(
    toE164: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void> {
    const paidZar = (payload.amountPaidCents / 100).toFixed(2);
    const code = payload.bookingCode?.trim() || payload.bookingId.slice(0, 8);
    const body = `${payload.businessName}: payment recorded — total paid R${paidZar}. ${payload.styleNames} at ${payload.scheduledAtIso}. ${payload.paymentStatus}. Code ${code}`;
    await this.sendToCustomer(toE164, body);
  }

  private async sendToAdminNumber(body: string): Promise<void> {
    const to = this.config.get<string>('TWILIO_TO_NUMBER');
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (!to || !from || !sid || !token) {
      this.logger.warn(
        'Twilio SMS skipped: missing TWILIO_TO_NUMBER or credentials',
      );
      return;
    }
    await this.sendRaw(to, from, sid, token, body);
  }

  private async sendToCustomer(
    toE164: string,
    body: string,
  ): Promise<void> {
    const from = this.config.get<string>('TWILIO_FROM_NUMBER');
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    if (!from || !sid || !token) {
      this.logger.warn(
        'Twilio customer SMS skipped: missing TWILIO_FROM_NUMBER or credentials',
      );
      return;
    }
    await this.sendRaw(toE164, from, sid, token, body);
  }

  private async sendRaw(
    to: string,
    from: string,
    sid: string,
    token: string,
    body: string,
  ): Promise<void> {
    try {
      const client = twilio(sid, token);
      await client.messages.create({ to, from, body });
      this.logger.log(`Twilio SMS sent to ${to}`);
    } catch (err) {
      this.logger.error('Twilio SMS failed', err as Error);
    }
  }
}
