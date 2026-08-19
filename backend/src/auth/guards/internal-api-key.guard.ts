import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const HEADER = 'x-internal-key';

/** Authenticates server-to-server requests (e.g. the daily article-generator
 * Routine) with a static shared secret instead of a user JWT — no human is
 * logged in when the caller fires. Fails closed if INTERNAL_API_KEY is unset. */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (!expected) {
      throw new ServiceUnavailableException(
        'INTERNAL_API_KEY belum dikonfigurasi',
      );
    }
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[HEADER];
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid internal key');
    }
    return true;
  }
}
