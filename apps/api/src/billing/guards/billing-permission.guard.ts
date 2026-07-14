import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class BillingPermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { companyIds?: string[]; permissions?: string[] } }>();
    if (!request.user?.companyIds?.length) throw new ForbiddenException('Billing requires company workspace access.');
    return true;
  }
}
