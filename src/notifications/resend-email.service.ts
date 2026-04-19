import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailService } from './email.service.interface';

@Injectable()
export class ResendEmailService implements EmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');
    const to = this.config.get<string>('NOTIFY_EMAIL_TO');
    if (!apiKey || !from || !to) {
      this.logger.warn(
        'Resend email skipped: RESEND_API_KEY, EMAIL_FROM, or NOTIFY_EMAIL_TO missing',
      );
      return;
    }
    const subject = 'New Kutz booking';
    const text = `User ${payload.clerkUserId} scheduled ${payload.scheduledAtIso}. Notes: ${payload.hasNotes ? 'yes' : 'no'}`;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        this.logger.error(`Resend error ${res.status}: ${await res.text()}`);
        return;
      }
      this.logger.log('Resend email sent');
    } catch (err) {
      this.logger.error('Resend email failed', err as Error);
    }
  }
}
