import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { ClerkRequestUser } from '../auth/clerk-user.types';
import { ApiStandardErrorResponses } from '../common/swagger/api-standard-error-responses';
import {
  bookingPaymentIntentResponseOpenApiSchema,
  bookingResponseOpenApiSchema,
} from '../common/swagger/openapi-schemas';
import { BookingsService } from './bookings.service';
import {
  CreateBookingBodyDto,
  SyncBookingPaymentBodyDto,
  UpdateBookingBodyDto,
} from './schemas/booking.zod';
import type {
  BookingPaymentIntentResponse,
  BookingResponse,
} from './schemas/booking.zod';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings for the authenticated Clerk user' })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Bookings for current user',
    schema: {
      type: 'array',
      items: bookingResponseOpenApiSchema,
    },
  })
  list(@CurrentUser() user: ClerkRequestUser): Promise<BookingResponse[]> {
    return this.bookingsService.listForUser(user.clerkUserId);
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Create a booking (styleIds: one or more services in a single slot; optional notes as plain text)',
  })
  @ApiStandardErrorResponses()
  @ApiCreatedResponse({
    description: 'Created booking',
    schema: bookingResponseOpenApiSchema,
  })
  create(
    @CurrentUser() user: ClerkRequestUser,
    @Body() body: CreateBookingBodyDto,
  ): Promise<BookingResponse> {
    return this.bookingsService.createForUser(user.clerkUserId, body);
  }

  @Post(':id/payment-intent')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Create or resume a Stripe PaymentIntent for a pending paid booking (ZAR)',
  })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Client secret for Stripe.js Payment Element',
    schema: bookingPaymentIntentResponseOpenApiSchema,
  })
  createPaymentIntent(
    @CurrentUser() user: ClerkRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingPaymentIntentResponse> {
    return this.bookingsService.createPaymentIntentForBooking(
      user.clerkUserId,
      id,
    );
  }

  @Patch(':id/payment')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Sync booking payment from Stripe after client-side success (retrieves PaymentIntent, same as webhook)',
  })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Booking with updated payment fields',
    schema: bookingResponseOpenApiSchema,
  })
  syncPayment(
    @CurrentUser() user: ClerkRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _body: SyncBookingPaymentBodyDto,
  ): Promise<BookingResponse> {
    return this.bookingsService.syncPaymentFromStripeForUser(
      user.clerkUserId,
      id,
    );
  }

  @Patch(':id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Update booking: optional time, notes, and/or services (styleIds replaces linked styles)',
  })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Updated booking',
    schema: bookingResponseOpenApiSchema,
  })
  update(
    @CurrentUser() user: ClerkRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBookingBodyDto,
  ): Promise<BookingResponse> {
    return this.bookingsService.updateForUser(user.clerkUserId, id, body);
  }

  @Post(':id/cancel')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Cancelled booking',
    schema: bookingResponseOpenApiSchema,
  })
  cancel(
    @CurrentUser() user: ClerkRequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponse> {
    return this.bookingsService.cancelForUser(user.clerkUserId, id);
  }
}
