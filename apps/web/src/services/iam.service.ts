import { api } from './api';
import type { PermissionUiModule } from '@/features/permissions/types/permission-ui.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type IamRole = {
  id: string;
  key: string;
  name: string;
  rolePermissions?: Array<{ permission?: IamPermission }>;
};

export type IamPermission = {
  id: string;
  key: string;
  moduleKey: string;
  label: string;
};

export type AdminAuditEvent = {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorId?: string | null;
  createdAt?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type IamUser = {
  id: string;
  email: string;
  displayName: string;
  title?: string | null;
  department?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'ARCHIVED';
  temporaryPassword?: string;
  shownOnce?: boolean;
  userRoles?: Array<{ role?: IamRole }>;
  userSites?: Array<{ site?: { id: string; name: string; code: string } }>;
  profile?: {
    avatarUrl?: string | null;
    phone?: string | null;
    mobile?: string | null;
    timezone?: string | null;
    locale?: string | null;
    bio?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  tenant?: { name: string } | null;
};

export type IamAccessReference = {
  companies: Array<{ id: string; name: string; code?: string | null }>;
  sites: Array<{ id: string; name: string; code: string; companyId?: string | null }>;
  units: Array<{ id: string; name: string; code: string; siteId: string }>;
  areas: Array<{ id: string; name: string; code: string; unitId: string }>;
  departments: Array<{ id: string; name: string; code?: string | null; siteId?: string | null }>;
  contractorCompanies: Array<{ id: string; name: string; code?: string | null }>;
};

export type CreateUserInput = {
  email: string;
  personalEmail?: string;
  displayName: string;
  title?: string;
  department?: string;
  employeeId?: string;
  phone?: string;
  employerType?: string;
  roleIds?: string[];
  companyIds?: string[];
  siteIds?: string[];
  authMethod?: 'invite' | 'generated_password' | 'sso';
  sendTo?: 'work' | 'personal' | 'both' | 'none';
  forcePasswordChange?: boolean;
  password?: string;
};

export type EffectivePermissionSummary = {
  user?: IamUser | null;
  permissions: string[];
  allowedPermissions?: string[];
  deniedPermissions?: string[];
  permissionModules?: PermissionUiModule[];
  modules?: PermissionUiModule[];
  roles: Array<Record<string, unknown>>;
  scopes: {
    companyIds: string[];
    siteIds: string[];
    unitIds: string[];
    areaIds: string[];
  };
};

export type UserRemovalImpact = {
  userId: string;
  canRemove: boolean;
  blockers: Array<{ type: string; count: number; message: string }>;
  records: Array<{ module: string; id: string; title: string; status?: string | null }>;
};

export type ProfileInvitation = {
  id: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Cancelled';
  expired?: boolean;
  studyNumber?: string | null;
  studyTitle?: string | null;
  studyRole?: string | null;
  discipline?: string | null;
  requiredAttendance?: boolean;
  signoffRequired?: boolean;
  expiresAt?: string | null;
  decline_reason?: string | null;
  sourceModule?: 'HAZOP' | 'Incident' | string;
  recordUrl?: string | null;
  invitedBy?: { id: string; displayName?: string | null; email?: string | null; title?: string | null } | null;
  study?: { id: string; study_number?: string | null; title?: string | null; status?: string | null } | null;
};

export const iamService = {
  async users(): Promise<IamUser[]> {
    return unwrap(await api.get('/admin/users'));
  },
  async exportUsers(): Promise<{ fileName: string; contentType: string; csv: string }> {
    return unwrap(await api.get('/admin/users/export'));
  },
  async user(id: string): Promise<IamUser> {
    return unwrap(await api.get(`/admin/users/${id}`));
  },
  async userAudit(id: string): Promise<AdminAuditEvent[]> {
    return unwrap(await api.get(`/admin/users/${id}/audit`));
  },
  async createUser(input: CreateUserInput): Promise<IamUser> {
    return unwrap(await api.post('/admin/users', input));
  },
  async updateUser(id: string, input: Partial<CreateUserInput>): Promise<IamUser> {
    return unwrap(await api.patch(`/admin/users/${id}`, input));
  },
  async setUserStatus(id: string, action: 'suspend' | 'deactivate' | 'reactivate'): Promise<IamUser> {
    return unwrap(await api.post(`/admin/users/${id}/${action}`));
  },
  async archiveUser(id: string, reason?: string): Promise<IamUser> {
    return unwrap(await api.post(`/admin/users/${id}/archive`, { reason }));
  },
  async restoreUser(id: string): Promise<IamUser> {
    return unwrap(await api.post(`/admin/users/${id}/restore`));
  },
  async deleteUser(id: string, reason?: string) {
    return unwrap(await api.delete(`/admin/users/${id}`, { params: { reason } }));
  },
  async removalImpact(id: string): Promise<UserRemovalImpact> {
    return unwrap(await api.get(`/admin/users/${id}/removal-impact`));
  },
  async resetPassword(id: string, generateTemporaryPassword = true): Promise<{ userId: string; temporaryPassword?: string; resetToken?: string; resetUrl?: string; shownOnce?: boolean }> {
    return unwrap(await api.post(`/admin/users/${id}/reset-password`, { generateTemporaryPassword }));
  },
  async resendInvite(id: string) {
    return unwrap(await api.post(`/admin/users/${id}/resend-invite`));
  },
  async inviteExistingUser(id: string) {
    return unwrap(await api.post(`/admin/users/${id}/invite`));
  },
  async forceLogout(id: string, reason?: string) {
    return unwrap(await api.post(`/admin/users/${id}/force-logout`, { reason }));
  },
  async effectivePermissions(id: string): Promise<EffectivePermissionSummary> {
    return unwrap(await api.get(`/admin/users/${id}/effective-permissions`));
  },
  async meEffectivePermissions(): Promise<EffectivePermissionSummary> {
    return unwrap(await api.get('/auth/me/permissions'));
  },
  async testPermission(id: string, permission: string): Promise<{ permission: string; allowed: boolean }> {
    return unwrap(await api.post(`/admin/users/${id}/test-permission`, { permission }));
  },
  async applyModulePreset(userId: string, input: { moduleKey: string; presetName: string; companyId?: string; siteId?: string }) {
    return unwrap(await api.post(`/admin/users/${userId}/module-permissions/preset`, input));
  },
  async addPermissionOverride(userId: string, input: { permissionKeys?: string[]; permissionKey?: string; effect?: 'allow' | 'deny'; companyId?: string; siteId?: string; reason?: string }) {
    return unwrap(await api.post(`/admin/users/${userId}/permissions`, input));
  },
  async removePermissionOverride(userId: string, overrideId: string) {
    return unwrap(await api.delete(`/admin/users/${userId}/permissions/${overrideId}`));
  },
  async updateAccessScope(userId: string, input: { companyIds?: string[]; siteIds?: string[]; unitIds?: string[]; areaIds?: string[]; replace?: boolean }) {
    return unwrap(await api.patch(`/admin/users/${userId}/access-scope`, input));
  },
  async inviteUser(input: { email: string; roleId?: string; siteId?: string; companyId?: string }) {
    return unwrap(await api.post('/admin/users/invite', input));
  },
  async bulkImportUsers(users: Array<CreateUserInput & { roleId?: string; siteId?: string }>) {
    return unwrap(await api.post('/admin/users/bulk-upload', { users, fileName: 'admin-ui-import.csv' }));
  },
  async bulkErrorReport(jobId: string) {
    return unwrap(await api.get(`/admin/users/bulk-upload/${jobId}/error-report`));
  },
  async assignRole(userId: string, input: { roleId: string; scopeType?: string; companyId?: string; siteId?: string }) {
    return unwrap(await api.post(`/admin/users/${userId}/roles`, input));
  },
  async removeRole(userId: string, roleId: string) {
    return unwrap(await api.delete(`/admin/users/${userId}/roles/${roleId}`));
  },
  async assignSiteAccess(userId: string, input: { siteId: string; companyId?: string; unitId?: string; areaId?: string }) {
    return unwrap(await api.post(`/admin/users/${userId}/site-access`, input));
  },
  async removeSiteAccess(userId: string, siteId: string) {
    return unwrap(await api.delete(`/admin/users/${userId}/site-access/${siteId}`));
  },
  async assignDepartment(userId: string, departmentId: string): Promise<IamUser> {
    return unwrap(await api.post(`/admin/users/${userId}/department/${departmentId}`));
  },
  async assignDelegation(userId: string, input: { delegateId: string; moduleKey?: string; startsAt: string; endsAt: string }) {
    return unwrap(await api.post(`/admin/users/${userId}/delegations`, input));
  },
  async assignContractorAccess(userId: string, contractorCompanyId: string) {
    return unwrap(await api.post(`/admin/users/${userId}/contractor-access`, { contractorCompanyId }));
  },
  async accessReference(): Promise<IamAccessReference> {
    return unwrap(await api.get('/admin/users/access-reference'));
  },
  async roles(): Promise<IamRole[]> {
    return unwrap(await api.get('/admin/roles'));
  },
  async createRole(input: { key: string; name: string }): Promise<IamRole> {
    return unwrap(await api.post('/admin/roles', input));
  },
  async updateRole(id: string, input: { key?: string; name?: string }): Promise<IamRole> {
    return unwrap(await api.patch(`/admin/roles/${id}`, input));
  },
  async deleteRole(id: string): Promise<IamRole> {
    return unwrap(await api.delete(`/admin/roles/${id}`));
  },
  async roleUsers(id: string): Promise<IamUser[]> {
    return unwrap(await api.get(`/admin/roles/${id}/users`));
  },
  async permissions(): Promise<IamPermission[]> {
    return unwrap(await api.get('/admin/permissions'));
  },
  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<IamRole> {
    return unwrap(await api.post(`/admin/roles/${roleId}/permissions`, { permissionIds }));
  },
  async mePermissions(): Promise<string[]> {
    const response = unwrap<EffectivePermissionSummary | string[]>(await api.get('/auth/me/permissions'));
    return Array.isArray(response) ? response : response.permissions ?? [];
  },
  async meNavigation(): Promise<{ items: Array<{ label: string; href: string; moduleKey: string; group: string }>; permissions: string[] }> {
    return unwrap(await api.get('/auth/me/navigation'));
  },
  async me(): Promise<IamUser> {
    return unwrap(await api.get('/me'));
  },
  async updateProfile(input: Partial<CreateUserInput> & { avatarUrl?: string; phone?: string; mobile?: string; timezone?: string; locale?: string; bio?: string }): Promise<IamUser> {
    return unwrap(await api.patch('/profile', input));
  },
  async changePassword(input: { currentPassword?: string; newPassword: string }) {
    return unwrap(await api.post('/profile/change-password', input));
  },
  async securityEvents() {
    return unwrap(await api.get('/profile/security-events'));
  },
  async profileInvitations(): Promise<ProfileInvitation[]> {
    return unwrap(await api.get('/profile/invitations'));
  },
  async acceptProfileInvitation(id: string) {
    return unwrap(await api.post(`/profile/invitations/${id}/accept`));
  },
  async declineProfileInvitation(id: string, reason?: string) {
    return unwrap(await api.post(`/profile/invitations/${id}/decline`, { reason }));
  }
};
