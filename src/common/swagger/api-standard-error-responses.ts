import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { httpErrorOpenApiSchema } from './openapi-schemas';

const badRequest = {
  description: 'Validation failed (Zod / pipe)',
  schema: httpErrorOpenApiSchema,
};

const unauthorized = {
  description: 'Missing or invalid Clerk JWT',
  schema: httpErrorOpenApiSchema,
};

const forbidden = {
  description: 'Not in ADMIN_CLERK_USER_IDS',
  schema: httpErrorOpenApiSchema,
};

const notFound = {
  description: 'Resource not found',
  schema: httpErrorOpenApiSchema,
};

export function ApiStandardErrorResponses(options?: {
  includeNotFound?: boolean;
}): MethodDecorator {
  const decorators = [
    ApiBadRequestResponse(badRequest),
    ApiUnauthorizedResponse(unauthorized),
  ];
  if (options?.includeNotFound) {
    decorators.push(ApiNotFoundResponse(notFound));
  }
  return applyDecorators(...decorators);
}

export function ApiAdminStandardErrorResponses(): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse(badRequest),
    ApiUnauthorizedResponse(unauthorized),
    ApiForbiddenResponse(forbidden),
  );
}

/** Public read-only routes without auth (e.g. validation on query params later). */
export function ApiValidationOnlyResponse(): MethodDecorator {
  return applyDecorators(ApiBadRequestResponse(badRequest));
}
