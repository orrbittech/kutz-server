import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { LoggerOptions } from 'typeorm';
import { getCacheTtlMs } from './common/cache/cache-ttl';
import { parseEnvBoolean } from './common/config/env-boolean';
import { GlobalHttpExceptionFilter } from './common/http/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { StylesModule } from './styles/styles.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { GallerySlidesModule } from './gallery-slides/gallery-slides.module';
import { TeamMembersModule } from './team-members/team-members.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: getCacheTtlMs(config),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const synchronize = true;
        const nodeEnv = config.get<string>('NODE_ENV');
        const logging: LoggerOptions =
          nodeEnv === 'production' ? false : ['error'];
        return {
          type: 'postgres' as const,
          url: config.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize,
          logging,
        };
      },
    }),
    AuthModule,
    HealthModule,
    StylesModule,
    TeamMembersModule,
    GallerySlidesModule,
    SiteSettingsModule,
    BookingsModule,
    OrdersModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
