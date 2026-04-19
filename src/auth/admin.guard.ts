import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { ClerkRequestUser } from './clerk-user.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: ClerkRequestUser }>();
    if (!request.user?.clerkUserId) {
      throw new ForbiddenException('Admin access required');
    }
    if (!request.user.isAdmin) {
      throw new ForbiddenException('Not an administrator');
    }
    return true;
  }
}
