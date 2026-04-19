import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ClerkRequestUser } from '../auth/clerk-user.types';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { OrderEntity } from '../database/entities/order.entity';
import { OrderStatus } from '../domain/enums';
import type { OrderResponse } from './schemas/order.zod';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
  ) {}

  private shouldAudit(): boolean {
    if (this.config.get<string>('AUDIT_LOG') === 'true') return true;
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private auditLog(action: string, meta: Record<string, string>): void {
    if (!this.shouldAudit()) return;
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  private accessLog(action: string, meta: Record<string, string>): void {
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  async listForActor(user: ClerkRequestUser): Promise<OrderResponse[]> {
    if (user.isAdmin) {
      this.accessLog('orders_list', {
        clerkUserId: user.clerkUserId,
        scope: 'all',
      });
      const rows = await this.orders.find({
        order: { createdAt: 'DESC' },
      });
      return rows.map((row) => this.toResponse(row));
    }
    return this.listForUser(user.clerkUserId);
  }

  async listForUser(clerkUserId: string): Promise<OrderResponse[]> {
    this.accessLog('orders_list', { clerkUserId, scope: 'own' });
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.ordersList(clerkUserId),
      async () => {
        const rows = await this.orders.find({
          where: { clerkUserId },
          order: { createdAt: 'DESC' },
        });
        return rows.map((row) => this.toResponse(row));
      },
      ttl,
    );
  }

  async createForUser(
    clerkUserId: string,
    input: {
      lineItems: { name: string; quantity: number; unitPriceCents: number }[];
      notes?: string;
    },
  ): Promise<OrderResponse> {
    this.accessLog('orders_create_for_user', {
      clerkUserId,
      lineItemCount: String(input.lineItems.length),
    });
    const totalCents = input.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
    const notesPlain = input.notes?.trim() ?? '';
    const row = this.orders.create({
      clerkUserId,
      status: OrderStatus.DRAFT,
      totalCents,
      lineItems: input.lineItems,
      notes: notesPlain,
    });
    const saved = await this.orders.save(row);
    await this.cache.del(cacheKeys.ordersList(clerkUserId));
    this.auditLog('order_created', { orderId: saved.id, clerkUserId });
    return this.toResponse(saved);
  }

  private toResponse(row: OrderEntity): OrderResponse {
    const notes = row.notes ?? '';
    return {
      id: row.id,
      clerkUserId: row.clerkUserId,
      status: row.status,
      totalCents: row.totalCents,
      lineItems: row.lineItems,
      notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
