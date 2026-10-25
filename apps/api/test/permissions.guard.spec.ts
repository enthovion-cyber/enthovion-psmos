import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error Vitest needs the extension to avoid the stale generated .js file beside the source.
import { PermissionsGuard } from '../src/common/guards/permissions.guard.ts';

function contextWithPermissions(permissions: string[]) {
  const request = { user: { permissions } };
  return {
    request,
    context: {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request
    })
    } as any
  };
}

describe('PermissionsGuard', () => {
  it('allows the executive dashboard for users with the general dashboard permission', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['executive.dashboard.view'])
    };
    const permissions = { listForUser: vi.fn().mockResolvedValue([]) };
    const guard = new PermissionsGuard(reflector as any, permissions as any);
    const { context, request } = contextWithPermissions(['dashboard.view']);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user.permissions).toContain('executive.dashboard.view');
  });

  it('still rejects the executive dashboard when no matching permission is granted', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['executive.dashboard.view'])
    };
    const permissions = { listForUser: vi.fn().mockResolvedValue([]) };
    const guard = new PermissionsGuard(reflector as any, permissions as any);

    await expect(guard.canActivate(contextWithPermissions([]).context)).resolves.toBe(false);
  });

  it('reuses permissions already resolved by the tenant context guard', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['executive.dashboard.view'])
    };
    const permissions = { listForUser: vi.fn().mockResolvedValue([]) };
    const guard = new PermissionsGuard(reflector as any, permissions as any);
    const request = { user: { permissions: ['executive.dashboard.view'], tenantContext: {} } };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request })
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissions.listForUser).not.toHaveBeenCalled();
  });
});
