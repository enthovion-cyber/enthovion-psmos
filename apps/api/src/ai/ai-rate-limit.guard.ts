import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';

type RateRecord = { count: number; resetAt: number };
const requestMap = new Map<string, RateRecord>();

/**
 * Enterprise In-Memory AI Rate Limiter:
 * Caps AI requests at 60 requests per minute per tenant/user to prevent token abuse and API flooding.
 */
@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly limit = 60; // Max requests
  private readonly windowMs = 60 * 1000; // 1 minute window

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    const key = user ? `${user.tenantId}:${user.id}` : 'anonymous';

    const now = Date.now();
    const record = requestMap.get(key);

    if (!record || now > record.resetAt) {
      requestMap.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.limit) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `AI rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`,
          retryAfter: waitSeconds
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }
}
