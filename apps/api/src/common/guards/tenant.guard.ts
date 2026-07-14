import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantNotFoundException } from '../exceptions/tenant-not-found.exception';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; tenantId?: string; user?: { tenantId?: string } }>();
    const tenantId = request.headers['x-tenant-id'] ?? request.user?.tenantId;
    if (!tenantId) throw new TenantNotFoundException();
    if (request.user?.tenantId && request.user.tenantId !== tenantId) throw new ForbiddenException('Tenant header does not match the authenticated session');
    request.tenantId = tenantId;
    return true;
  }
}
