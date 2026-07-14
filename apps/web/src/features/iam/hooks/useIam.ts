'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { iamService, type CreateUserInput } from '@/services/iam.service';

export function useIamUsers() {
  return useQuery({ queryKey: ['iam', 'users'], queryFn: () => iamService.users() });
}

export function useIamUser(id: string) {
  return useQuery({ queryKey: ['iam', 'users', id], queryFn: () => iamService.user(id), enabled: Boolean(id) });
}

export function useIamRoles() {
  return useQuery({ queryKey: ['iam', 'roles'], queryFn: () => iamService.roles() });
}

export function useIamPermissions() {
  return useQuery({ queryKey: ['iam', 'permissions'], queryFn: () => iamService.permissions() });
}

export function useMyPermissions() {
  return useQuery({ queryKey: ['iam', 'me', 'permissions'], queryFn: () => iamService.mePermissions() });
}

export function useMyEffectivePermissions() {
  return useQuery({ queryKey: ['iam', 'me', 'effective-permissions'], queryFn: () => iamService.meEffectivePermissions(), staleTime: 60_000 });
}

export function useMyNavigation() {
  return useQuery({ queryKey: ['iam', 'me', 'navigation'], queryFn: () => iamService.meNavigation(), staleTime: 60_000 });
}

export function useMe() {
  return useQuery({ queryKey: ['iam', 'me'], queryFn: () => iamService.me() });
}

export function useProfileInvitations() {
  return useQuery({ queryKey: ['iam', 'me', 'invitations'], queryFn: () => iamService.profileInvitations() });
}

export function useIamAccessReference() {
  return useQuery({ queryKey: ['iam', 'access-reference'], queryFn: () => iamService.accessReference() });
}

export function useEffectivePermissions(userId: string) {
  return useQuery({ queryKey: ['iam', 'users', userId, 'effective-permissions'], queryFn: () => iamService.effectivePermissions(userId), enabled: Boolean(userId) });
}

export function useRemovalImpact(userId: string) {
  return useQuery({ queryKey: ['iam', 'users', userId, 'removal-impact'], queryFn: () => iamService.removalImpact(userId), enabled: Boolean(userId) });
}

export function useUserAudit(userId: string) {
  return useQuery({ queryKey: ['iam', 'users', userId, 'audit'], queryFn: () => iamService.userAudit(userId), enabled: Boolean(userId) });
}

export function useProfileSecurityEvents() {
  return useQuery({ queryKey: ['iam', 'me', 'security-events'], queryFn: () => iamService.securityEvents() });
}

export function useIamMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['iam', 'users'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'roles'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'permissions'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'me'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'me', 'invitations'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'me', 'permissions'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'me', 'effective-permissions'] }),
      queryClient.invalidateQueries({ queryKey: ['iam', 'me', 'navigation'] })
    ]);
  };

  return {
    createUser: useMutation({ mutationFn: (input: CreateUserInput) => iamService.createUser(input), onSuccess: invalidate }),
    inviteUser: useMutation({ mutationFn: (input: { email: string; roleId?: string; siteId?: string; companyId?: string }) => iamService.inviteUser(input), onSuccess: invalidate }),
    bulkImportUsers: useMutation({ mutationFn: (users: Array<CreateUserInput & { roleId?: string; siteId?: string }>) => iamService.bulkImportUsers(users), onSuccess: invalidate }),
    updateUser: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CreateUserInput> }) => iamService.updateUser(id, input), onSuccess: invalidate }),
    setUserStatus: useMutation({ mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'deactivate' | 'reactivate' }) => iamService.setUserStatus(id, action), onSuccess: invalidate }),
    archiveUser: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => iamService.archiveUser(id, reason), onSuccess: invalidate }),
    restoreUser: useMutation({ mutationFn: (id: string) => iamService.restoreUser(id), onSuccess: invalidate }),
    deleteUser: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => iamService.deleteUser(id, reason), onSuccess: invalidate }),
    resetPassword: useMutation({ mutationFn: ({ id, generateTemporaryPassword }: { id: string; generateTemporaryPassword?: boolean }) => iamService.resetPassword(id, generateTemporaryPassword), onSuccess: invalidate }),
    resendInvite: useMutation({ mutationFn: (id: string) => iamService.resendInvite(id), onSuccess: invalidate }),
    forceLogout: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => iamService.forceLogout(id, reason), onSuccess: invalidate }),
    testPermission: useMutation({ mutationFn: ({ id, permission }: { id: string; permission: string }) => iamService.testPermission(id, permission) }),
    applyModulePreset: useMutation({ mutationFn: ({ userId, input }: { userId: string; input: { moduleKey: string; presetName: string; companyId?: string; siteId?: string } }) => iamService.applyModulePreset(userId, input), onSuccess: invalidate }),
    addPermissionOverride: useMutation({ mutationFn: ({ userId, input }: { userId: string; input: Parameters<typeof iamService.addPermissionOverride>[1] }) => iamService.addPermissionOverride(userId, input), onSuccess: invalidate }),
    removePermissionOverride: useMutation({ mutationFn: ({ userId, overrideId }: { userId: string; overrideId: string }) => iamService.removePermissionOverride(userId, overrideId), onSuccess: invalidate }),
    updateAccessScope: useMutation({ mutationFn: ({ userId, input }: { userId: string; input: Parameters<typeof iamService.updateAccessScope>[1] }) => iamService.updateAccessScope(userId, input), onSuccess: invalidate }),
    assignRole: useMutation({ mutationFn: ({ userId, ...input }: { userId: string; roleId: string; scopeType?: string; companyId?: string; siteId?: string }) => iamService.assignRole(userId, input), onSuccess: invalidate }),
    removeRole: useMutation({ mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => iamService.removeRole(userId, roleId), onSuccess: invalidate }),
    assignSiteAccess: useMutation({ mutationFn: ({ userId, ...input }: { userId: string; siteId: string; companyId?: string; unitId?: string; areaId?: string }) => iamService.assignSiteAccess(userId, input), onSuccess: invalidate }),
    removeSiteAccess: useMutation({ mutationFn: ({ userId, siteId }: { userId: string; siteId: string }) => iamService.removeSiteAccess(userId, siteId), onSuccess: invalidate }),
    assignDepartment: useMutation({ mutationFn: ({ userId, departmentId }: { userId: string; departmentId: string }) => iamService.assignDepartment(userId, departmentId), onSuccess: invalidate }),
    assignDelegation: useMutation({ mutationFn: ({ userId, input }: { userId: string; input: { delegateId: string; moduleKey?: string; startsAt: string; endsAt: string } }) => iamService.assignDelegation(userId, input), onSuccess: invalidate }),
    assignContractorAccess: useMutation({ mutationFn: ({ userId, contractorCompanyId }: { userId: string; contractorCompanyId: string }) => iamService.assignContractorAccess(userId, contractorCompanyId), onSuccess: invalidate }),
    createRole: useMutation({ mutationFn: (input: { key: string; name: string }) => iamService.createRole(input), onSuccess: invalidate }),
    updateRole: useMutation({ mutationFn: ({ id, input }: { id: string; input: { key?: string; name?: string } }) => iamService.updateRole(id, input), onSuccess: invalidate }),
    deleteRole: useMutation({ mutationFn: (id: string) => iamService.deleteRole(id), onSuccess: invalidate }),
    setRolePermissions: useMutation({ mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => iamService.setRolePermissions(roleId, permissionIds), onSuccess: invalidate }),
    updateProfile: useMutation({
      mutationFn: (input: Parameters<typeof iamService.updateProfile>[0]) => iamService.updateProfile(input),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['iam', 'me'] }),
          queryClient.invalidateQueries({ queryKey: ['iam', 'users'] })
        ]);
      }
    }),
    changePassword: useMutation({ mutationFn: (input: { currentPassword?: string; newPassword: string }) => iamService.changePassword(input), onSuccess: invalidate }),
    acceptProfileInvitation: useMutation({ mutationFn: (id: string) => iamService.acceptProfileInvitation(id), onSuccess: invalidate }),
    declineProfileInvitation: useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => iamService.declineProfileInvitation(id, reason), onSuccess: invalidate })
  };
}
