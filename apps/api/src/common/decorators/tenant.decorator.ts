import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Tenant = createParamDecorator((_: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<{ tenantId?: string; user?: { tenantId?: string } }>();
  return request.tenantId ?? request.user?.tenantId ?? '';
});
