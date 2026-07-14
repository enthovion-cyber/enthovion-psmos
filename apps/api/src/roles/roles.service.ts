import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { SearchIndexService } from '../search/search-index.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly searchIndex: SearchIndexService
  ) {}

  list(tenantId: string) {
    return this.db.many(this.db.from('Role').select('*, rolePermissions:RolePermission(*, permission:Permission(*))').eq('tenantId', tenantId));
  }

  async create(tenantId: string, actorId: string, dto: CreateRoleDto) {
    const role = await this.db.single<any>(
      this.db.from('Role').insert({
        id: crypto.randomUUID(),
        tenantId,
        key: dto.key.trim().toLowerCase().replace(/\s+/g, '_'),
        name: dto.name,
        description: dto.description ?? null,
        scopeType: dto.scopeType ?? 'TENANT',
        systemRole: dto.systemRole ?? false,
        updatedAt: new Date().toISOString()
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'ROLE_CREATED', entityType: 'Role', entityId: role.id, after: role as JsonValue });
    await this.searchIndex.reindexModule(tenantId, 'roles');
    return role;
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateRoleDto) {
    const before = await this.get(tenantId, id);
    const role = await this.db.single<any>(
      this.db.from('Role')
        .update({
          ...(dto.key ? { key: dto.key.trim().toLowerCase().replace(/\s+/g, '_') } : {}),
          ...(dto.name ? { name: dto.name } : {}),
          updatedAt: new Date().toISOString()
        })
        .eq('tenantId', tenantId)
        .eq('id', id)
        .select()
        .single()
    );
    await this.audit.write({ tenantId, actorId, action: 'ROLE_UPDATED', entityType: 'Role', entityId: id, before: before as JsonValue, after: role as JsonValue });
    await this.searchIndex.reindexModule(tenantId, 'roles');
    return role;
  }

  async delete(tenantId: string, actorId: string, id: string) {
    const target = await this.get(tenantId, id);
    if (target.systemRole || target.key === 'super_admin' || target.key === 'platform_admin') throw new BadRequestException('System and super admin roles cannot be deleted');
    const assigned = await this.db.many<any>(this.db.from('UserRole').select('userId').eq('roleId', id).limit(1));
    if (assigned.length) throw new BadRequestException('Role cannot be deleted while assigned to users');
    const role = await this.db.single<any>(this.db.from('Role').delete().eq('tenantId', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'ROLE_DELETED', entityType: 'Role', entityId: id, before: role as JsonValue });
    await this.searchIndex.removeRecord(tenantId, 'roles', id);
    return role;
  }

  async setPermissions(tenantId: string, actorId: string, id: string, permissionIds: string[]) {
    await this.get(tenantId, id);
    const permissions = permissionIds.length
      ? await this.db.many<any>(this.db.from('Permission').select('id').eq('tenantId', tenantId).in('id', permissionIds))
      : [];
    if (permissions.length !== permissionIds.length) throw new BadRequestException('One or more permissions are invalid for this tenant');
    await this.db.single(this.db.from('RolePermission').delete().eq('roleId', id));
    if (permissionIds.length) {
      await this.db.many(this.db.from('RolePermission').insert(permissionIds.map((permissionId) => ({ roleId: id, permissionId }))).select());
    }
    await this.audit.write({ tenantId, actorId, action: 'ROLE_PERMISSIONS_UPDATED', entityType: 'Role', entityId: id, after: { permissionIds } });
    return this.get(tenantId, id);
  }

  async duplicate(tenantId: string, actorId: string, id: string, name?: string) {
    const source = await this.get(tenantId, id);
    const duplicate = await this.db.single<any>(
      this.db.from('Role').insert({
        id: crypto.randomUUID(),
        tenantId,
        key: `${source.key}_copy_${Date.now()}`,
        name: name?.trim() || `${source.name} Copy`,
        description: source.description ?? null,
        scopeType: source.scopeType ?? 'TENANT',
        systemRole: false,
        updatedAt: new Date().toISOString()
      }).select().single()
    );
    const permissionIds = (source.rolePermissions ?? []).map((grant: any) => grant.permissionId).filter(Boolean);
    if (permissionIds.length) {
      await this.db.many(this.db.from('RolePermission').insert(permissionIds.map((permissionId: string) => ({ roleId: duplicate.id, permissionId }))).select());
    }
    await this.audit.write({ tenantId, actorId, action: 'ROLE_DUPLICATED', entityType: 'Role', entityId: duplicate.id, before: source as JsonValue, after: duplicate as JsonValue });
    await this.searchIndex.reindexModule(tenantId, 'roles');
    return this.get(tenantId, duplicate.id);
  }

  async usersForRole(tenantId: string, id: string) {
    await this.get(tenantId, id);
    const assignments = await this.db.many<any>(
      this.db.from('UserRole')
        .select('*, user:User(id,tenantId,email,displayName,title,department,status,createdAt,updatedAt)')
        .eq('roleId', id)
    );
    return assignments
      .filter((assignment) => assignment.user?.tenantId === tenantId)
      .map((assignment) => ({ ...assignment.user, assignment }));
  }

  async get(tenantId: string, id: string) {
    const role = await this.db.single<any>(this.db.from('Role').select('*, rolePermissions:RolePermission(*, permission:Permission(*))').eq('tenantId', tenantId).eq('id', id).maybeSingle());
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }
}
