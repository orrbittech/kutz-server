import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cacheKeys } from '../common/cache/cache-keys';
import { getCacheTtlMs } from '../common/cache/cache-ttl';
import { TeamMemberEntity } from '../database/entities/team-member.entity';
import type { TeamMemberResponse } from './schemas/team-member.zod';

@Injectable()
export class TeamMembersService {
  private readonly logger = new Logger(TeamMembersService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMembers: Repository<TeamMemberEntity>,
  ) {}

  private accessLog(action: string, meta: Record<string, string>): void {
    this.logger.log(`${action} ${JSON.stringify(meta)}`);
  }

  async listActive(): Promise<TeamMemberResponse[]> {
    this.accessLog('team_members_list_active', {});
    const ttl = getCacheTtlMs(this.config);
    return this.cache.wrap(
      cacheKeys.teamMembersActive(),
      async () => {
        const rows = await this.teamMembers.find({
          where: { isActive: true },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });
        return rows.map((row) => this.toResponse(row));
      },
      ttl,
    );
  }

  private toResponse(row: TeamMemberEntity): TeamMemberResponse {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
