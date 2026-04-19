import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClerkModule } from '../clerk/clerk.module';
import { BookingEntity } from '../database/entities/booking.entity';
import { BookingStyleEntity } from '../database/entities/booking-style.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { StripeModule } from '../stripe/stripe.module';
import { AdminBookingsController } from './admin-bookings.controller';
import { BookingRemindersService } from './booking-reminders.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PublicBookingsController } from './public-bookings.controller';
import { StripeBookingsWebhookController } from './stripe-bookings-webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, BookingStyleEntity]),
    ClerkModule,
    NotificationsModule,
    SiteSettingsModule,
    StripeModule,
  ],
  controllers: [
    BookingsController,
    AdminBookingsController,
    PublicBookingsController,
    StripeBookingsWebhookController,
  ],
  providers: [BookingsService, BookingRemindersService],
})
export class BookingsModule {}
