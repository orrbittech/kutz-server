import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { isAdminClerkUser } from './clerk-admin.util';
import type { ClerkRequestUser } from './clerk-user.types';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: ClerkRequestUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7);
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new UnauthorizedException('Server misconfiguration');
    }
    try {
      const payload = await verifyToken(token, { secretKey });
      const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
      if (!sub) {
        throw new UnauthorizedException('Invalid token subject');
      }
      const adminIdsCsv = this.config.get<string>('ADMIN_CLERK_USER_IDS');
      const isAdmin = isAdminClerkUser(sub, payload, adminIdsCsv);
      request.user = { clerkUserId: sub, isAdmin };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
