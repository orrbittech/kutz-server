import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkUsersService } from './clerk-users.service';

@Module({
  imports: [ConfigModule],
  providers: [ClerkUsersService],
  exports: [ClerkUsersService],
})
export class ClerkModule {}
