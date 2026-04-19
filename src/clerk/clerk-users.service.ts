import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ClerkContact = {
  email: string | null;
  /** E.164 when available */
  phoneE164: string | null;
};

type CacheEntry = { value: ClerkContact; expiresAt: number };

@Injectable()
export class ClerkUsersService {
  private readonly logger = new Logger(ClerkUsersService.name);
  private readonly client: ClerkClient | null;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 60_000;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('CLERK_SECRET_KEY');
    this.client = secret ? createClerkClient({ secretKey: secret }) : null;
    if (!this.client) {
      this.logger.warn(
        'CLERK_SECRET_KEY is not set; booking reminders cannot resolve email/phone',
      );
    }
  }

  async getContact(clerkUserId: string): Promise<ClerkContact> {
    const now = Date.now();
    const hit = this.cache.get(clerkUserId);
    if (hit && hit.expiresAt > now) {
      return hit.value;
    }

    if (!this.client) {
      return { email: null, phoneE164: null };
    }

    try {
      const user = await this.client.users.getUser(clerkUserId);
      const primaryId = user.primaryEmailAddressId;
      const email =
        user.emailAddresses?.find((e) => e.id === primaryId)?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress ??
        null;

      const verifiedPhones =
        user.phoneNumbers?.filter((p) => p.verification?.status === 'verified') ??
        [];
      const phoneE164 =
        verifiedPhones[0]?.phoneNumber ??
        user.phoneNumbers?.[0]?.phoneNumber ??
        null;

      const value: ClerkContact = { email, phoneE164 };
      this.cache.set(clerkUserId, {
        value,
        expiresAt: now + this.cacheTtlMs,
      });
      return value;
    } catch (err) {
      this.logger.error(
        `Clerk getUser failed for ${clerkUserId}`,
        err as Error,
      );
      return { email: null, phoneE164: null };
    }
  }
}
