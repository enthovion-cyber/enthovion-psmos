import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
