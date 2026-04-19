import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { ClerkRequestUser } from './clerk-user.types';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: ClerkRequestUser }>();
    const userId = request.user?.clerkUserId;
    if (!userId) {
      throw new ForbiddenException('Admin access required');
    }
    const raw = this.config.get<string>('ADMIN_CLERK_USER_IDS') ?? '';
    const admins = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (admins.length === 0) {
      throw new ForbiddenException('ADMIN_CLERK_USER_IDS is not configured');
    }
    if (!admins.includes(userId)) {
      throw new ForbiddenException('Not an administrator');
    }
    return true;
  }
}
