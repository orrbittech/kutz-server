import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { ClerkRequestUser } from '../auth/clerk-user.types';
import { ApiStandardErrorResponses } from '../common/swagger/api-standard-error-responses';
import { orderResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { OrdersService } from './orders.service';
import { CreateOrderBodyDto } from './schemas/order.zod';
import type { OrderResponse } from './schemas/order.zod';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary:
      'List orders: own orders for normal users; all orders when the actor is an admin (allowlist or Clerk role in JWT)',
  })
  @ApiStandardErrorResponses()
  @ApiOkResponse({
    description: 'Orders for current user, or all orders for admins',
    schema: {
      type: 'array',
      items: orderResponseOpenApiSchema,
    },
  })
  list(@CurrentUser() user: ClerkRequestUser): Promise<OrderResponse[]> {
    return this.ordersService.listForActor(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an order (optional notes stored as plain text)',
  })
  @ApiStandardErrorResponses()
  @ApiCreatedResponse({
    description: 'Created order',
    schema: orderResponseOpenApiSchema,
  })
  create(
    @CurrentUser() user: ClerkRequestUser,
    @Body() body: CreateOrderBodyDto,
  ): Promise<OrderResponse> {
    return this.ordersService.createForUser(user.clerkUserId, body);
  }
}
