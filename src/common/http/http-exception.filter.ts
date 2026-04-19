import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  code?: string;
};

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    const path = request.url ?? '';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const res =
        typeof raw === 'string' ? raw : (raw as Record<string, unknown>);
      const body = this.normalizeHttpException(res, status, path);
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const body: ErrorBody = {
      statusCode: status,
      message: 'Internal server error',
      error: 'Internal Server Error',
      path,
    };
    response.status(status).json(body);
  }

  private normalizeHttpException(
    res: string | Record<string, unknown>,
    status: number,
    path: string,
  ): ErrorBody {
    const errorName = HttpStatus[status] ?? 'Error';
    if (typeof res === 'string') {
      return {
        statusCode: status,
        message: res,
        error: errorName,
        path,
      };
    }
    const message = res.message;
    const code = typeof res.code === 'string' ? res.code : undefined;
    const statusCode =
      typeof res.statusCode === 'number' ? res.statusCode : status;
    const errStr = typeof res.error === 'string' ? res.error : errorName;
    return {
      statusCode,
      message: Array.isArray(message)
        ? message
        : ((message as string) ?? errStr),
      error: errStr,
      path,
      ...(code ? { code } : {}),
    };
  }
}
