import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSettingsEntity } from '../database/entities/site-settings.entity';
import { AdminSiteSettingsController } from './admin-site-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettingsEntity])],
  controllers: [PublicSiteSettingsController, AdminSiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
