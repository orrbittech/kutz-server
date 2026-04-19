import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Global()
@Module({
  providers: [ClerkAuthGuard, AdminGuard],
  exports: [ClerkAuthGuard, AdminGuard],
})
export class AuthModule {}
