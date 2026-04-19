import { Inject, Injectable } from '@nestjs/common';
import type { ClerkContact } from '../clerk/clerk-users.service';
import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';
import type { CustomerEmailService } from './customer-email.service.interface';
import { CUSTOMER_EMAIL_SERVICE } from './customer-email.service.interface';
import type { EmailService } from './email.service.interface';
import { EMAIL_SERVICE } from './email.service.interface';
import type { SmsService } from './sms.service.interface';
import { SMS_SERVICE } from './sms.service.interface';

@Injectable()
export class NotificationsFacade {
  constructor(
    @Inject(SMS_SERVICE) private readonly sms: SmsService,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService,
    @Inject(CUSTOMER_EMAIL_SERVICE)
    private readonly customerEmail: CustomerEmailService,
  ) {}

  async notifyBookingCreated(
    payload: {
      clerkUserId: string;
      scheduledAtIso: string;
      hasNotes: boolean;
    },
    flags: { sms: boolean; email: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (flags.sms) tasks.push(this.sms.sendBookingCreated(payload));
    if (flags.email) tasks.push(this.email.sendBookingCreated(payload));
    await Promise.all(tasks);
  }

  /** Customer SMS/email when booking is confirmed (e.g. no card required). */
  async notifyBookingConfirmedToCustomer(
    contact: ClerkContact,
    payload: BookingCustomerPayload,
    flags: { sms: boolean; email: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (flags.sms && contact.phoneE164) {
      tasks.push(
        this.sms.sendBookingConfirmedCustomer(contact.phoneE164, payload),
      );
    }
    if (flags.email && contact.email) {
      tasks.push(
        this.customerEmail.sendBookingConfirmed(contact.email, payload),
      );
    }
    await Promise.all(tasks);
  }

  async notifyBookingReminder(
    contact: ClerkContact,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
    flags: { sms: boolean; email: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (flags.sms && contact.phoneE164) {
      tasks.push(
        this.sms.sendBookingReminderCustomer(contact.phoneE164, kind, payload),
      );
    }
    if (flags.email && contact.email) {
      tasks.push(
        this.customerEmail.sendBookingReminder(contact.email, kind, payload),
      );
    }
    await Promise.all(tasks);
  }

  async notifyBookingThankYou(
    contact: ClerkContact,
    payload: BookingCustomerPayload,
    flags: { sms: boolean; email: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (flags.sms && contact.phoneE164) {
      tasks.push(
        this.sms.sendBookingThankYouCustomer(contact.phoneE164, payload),
      );
    }
    if (flags.email && contact.email) {
      tasks.push(
        this.customerEmail.sendBookingThankYou(contact.email, payload),
      );
    }
    await Promise.all(tasks);
  }

  async notifyBookingPaymentConfirmed(
    contact: ClerkContact,
    payload: BookingPaymentConfirmedPayload,
    flags: { sms: boolean; email: boolean },
  ): Promise<void> {
    const tasks: Promise<void>[] = [];
    if (flags.sms && contact.phoneE164) {
      tasks.push(
        this.sms.sendBookingPaymentConfirmedCustomer(
          contact.phoneE164,
          payload,
        ),
      );
    }
    if (flags.email && contact.email) {
      tasks.push(
        this.customerEmail.sendBookingPaymentConfirmed(contact.email, payload),
      );
    }
    await Promise.all(tasks);
  }
}
