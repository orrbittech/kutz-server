import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { StyleEntity } from '../database/entities/style.entity';
import type { StyleResponse } from './schemas/style.zod';

@Injectable()
export class StylesService {
  private readonly logger = new Logger(StylesService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectRepository(StyleEntity)
    private readonly styles: Repository<StyleEntity>,
  ) {}

  private accessLog(action: string, meta: Record<string, string>): void {
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  /** Invalidate after admin writes; catalog changed only via DB/migrations stays fresh within CACHE_TTL_MS. */
  private async invalidateActiveListCache(): Promise<void> {
    await this.cache.del(cacheKeys.stylesActive());
  }

  async listActive(): Promise<StyleResponse[]> {
    this.accessLog('styles_list_active', {});
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.stylesActive(),
      async () => {
        const rows = await this.styles.find({
          where: { isActive: true },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });
        return rows.map((row) => this.toResponse(row));
      },
      ttl,
    );
  }

  private toResponse(row: StyleEntity): StyleResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      priceCents: row.priceCents,
      durationMinutes: row.durationMinutes ?? null,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
