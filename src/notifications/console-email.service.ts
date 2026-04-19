import { Injectable, Logger } from '@nestjs/common';
import type { EmailService } from './email.service.interface';

@Injectable()
export class ConsoleEmailService implements EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  async sendBookingCreated(payload: {
    clerkUserId: string;
    scheduledAtIso: string;
    hasNotes: boolean;
  }): Promise<void> {
    this.logger.log(
      `[Email stub] booking for ${payload.clerkUserId} @ ${payload.scheduledAtIso} notes=${payload.hasNotes}`,
    );
  }
}
