import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { GallerySlideEntity } from '../database/entities/gallery-slide.entity';
import type { GallerySlideResponse } from './schemas/gallery-slide.zod';

@Injectable()
export class GallerySlidesService {
  private readonly logger = new Logger(GallerySlidesService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectRepository(GallerySlideEntity)
    private readonly gallerySlides: Repository<GallerySlideEntity>,
  ) {}

  private accessLog(action: string, meta: Record<string, string>): void {
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  async listActive(): Promise<GallerySlideResponse[]> {
    this.accessLog('gallery_slides_list_active', {});
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.gallerySlidesActive(),
      async () => {
        const rows = await this.gallerySlides.find({
          where: { isActive: true },
          order: { sortOrder: 'ASC', id: 'ASC' },
        });
        return rows.map((row) => this.toResponse(row));
      },
      ttl,
    );
  }

  private toResponse(row: GallerySlideEntity): GallerySlideResponse {
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      alt: row.alt,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
