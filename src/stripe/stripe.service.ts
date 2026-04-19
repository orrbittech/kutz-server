import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    this.client = secret
      ? new Stripe(secret, {
          apiVersion: '2025-02-24.acacia',
          typescript: true,
        })
      : null;
  }

  requireClient(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (set STRIPE_SECRET_KEY)',
      );
    }
    return this.client;
  }

  constructWebhookEvent(
    payload: Buffer | string,
    signature: string | string[] | undefined,
  ): Stripe.Event {
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!whSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }
    const sig = Array.isArray(signature) ? signature[0] : signature;
    if (!sig) {
      throw new InternalServerErrorException('Missing Stripe-Signature header');
    }
    const stripe = this.requireClient();
    return stripe.webhooks.constructEvent(payload, sig, whSecret);
  }
}
