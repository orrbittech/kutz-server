export interface EmailService {
  sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void>;
}

export const EMAIL_SERVICE = 'EMAIL_SERVICE';
