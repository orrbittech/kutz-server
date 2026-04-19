import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { BookingsService } from './bookings.service';

@ApiExcludeController()
@SkipThrottle()
@Controller('webhooks/stripe')
export class StripeBookingsWebhookController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly stripe: StripeService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('stripe-signature') sig: string | undefined,
    @Req() req: Request,
  ): Promise<{ received: boolean }> {
    const raw = req.body as Buffer;
    const event = this.stripe.constructWebhookEvent(raw, sig);
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await this.bookings.applyPaymentIntentSucceeded(pi);
    }
    return { received: true };
  }
}
