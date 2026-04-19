import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';

export interface SmsService {
  sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void>;
  sendBookingConfirmedCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingReminderCustomer(
    toE164: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingThankYouCustomer(
    toE164: string,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingPaymentConfirmedCustomer(
    toE164: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void>;
}

export const SMS_SERVICE = 'SMS_SERVICE';
