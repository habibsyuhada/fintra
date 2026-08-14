import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isReportable =
      !(exception instanceof HttpException) || exception.getStatus() >= 500;
    if (isReportable) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
