import type {
  BookingCustomerPayload,
  BookingPaymentConfirmedPayload,
  BookingReminderKind,
} from './booking-notification.types';

export interface CustomerEmailService {
  /** After a booking is confirmed without requiring online card payment. */
  sendBookingConfirmed(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingReminder(
    to: string,
    kind: BookingReminderKind,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingThankYou(
    to: string,
    payload: BookingCustomerPayload,
  ): Promise<void>;
  sendBookingPaymentConfirmed(
    to: string,
    payload: BookingPaymentConfirmedPayload,
  ): Promise<void>;
}

export const CUSTOMER_EMAIL_SERVICE = 'CUSTOMER_EMAIL_SERVICE';
