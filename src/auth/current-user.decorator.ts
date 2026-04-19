import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ClerkRequestUser } from './clerk-user.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClerkRequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: ClerkRequestUser }>();
    return request.user;
  },
);
