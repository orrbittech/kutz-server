import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ApiStandardErrorResponses,
  ApiValidationOnlyResponse,
} from '../common/swagger/api-standard-error-responses';
import { bookingOccupancyResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { BookingsService } from './bookings.service';
import {
  BookingOccupancyQueryDto,
  type BookingOccupancyResponse,
} from './schemas/booking.zod';

@ApiTags('public')
@Controller('public/bookings')
export class PublicBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('occupancy')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Per-style booking counts per UTC slot for selected styles (no auth); slot size from site settings',
  })
  @ApiStandardErrorResponses()
  @ApiValidationOnlyResponse()
  @ApiOkResponse({
    description: 'Slot occupancy for PENDING and CONFIRMED bookings',
    schema: bookingOccupancyResponseOpenApiSchema,
  })
  occupancy(@Query() query: BookingOccupancyQueryDto): Promise<BookingOccupancyResponse> {
    return this.bookingsService.getOccupancyForRange(
      new Date(query.from),
      new Date(query.to),
      query.styleIds,
    );
  }
}
