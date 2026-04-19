import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ApiAdminStandardErrorResponses } from '../common/swagger/api-standard-error-responses';
import { bookingResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { BookingsService } from './bookings.service';
import type { BookingResponse } from './schemas/booking.zod';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, AdminGuard)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post(':id/complete')
  @ApiOperation({
    summary:
      'Mark booking as serviced / visit complete (admin). Sends thank-you / receipt when enabled and not already sent.',
  })
  @ApiAdminStandardErrorResponses()
  @ApiOkResponse({
    description: 'Booking marked serviced',
    schema: bookingResponseOpenApiSchema,
  })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponse> {
    return this.bookingsService.completeBookingForAdmin(id);
  }
}
