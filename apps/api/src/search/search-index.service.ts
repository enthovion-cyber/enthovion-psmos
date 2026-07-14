import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { IndexRecordDto } from './dto/index-record.dto';
import { SearchRepository } from './repositories/search.repository';

@Injectable()
export class SearchIndexService {
  constructor(
    private readonly db: SupabaseService,
    private readonly repository: SearchRepository
  ) {}

  indexRecord(tenantId: string, input: IndexRecordDto & { searchableText?: string; metadata?: Record<string, unknown> | null }) {
    const moduleKey = normalizeModule(input.module);
    const entityType = input.recordType;
    const text = normalizeSearchText([
      input.recordNumber,
      input.title,
      input.subtitle,
      input.description,
      input.status,
      input.priority,
      input.searchableText
    ]);
    return this.repository.upsert({
      id: `search_${moduleKey}_${input.recordId}`,
      tenantId,
      siteId: input.siteId ?? null,
      moduleKey,
      entityType,
      entityId: input.recordId,
      recordType: input.recordType,
      recordNumber: input.recordNumber ?? null,
      title: input.title,
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      status: input.status ?? null,
      priority: input.priority ?? null,
      url: input.url ?? defaultUrl(moduleKey, input.recordId),
      text,
      tags: [input.recordNumber, input.title, input.status, input.priority].filter(Boolean) as string[],
      metadata: input.metadata ?? null,
      updatedAt: new Date().toISOString()
    });
  }

  removeRecord(tenantId: string, moduleKey: string, recordId: string) {
    return this.repository.remove(tenantId, normalizeModule(moduleKey), recordId);
  }

  async reindexModule(tenantId: string, moduleKey: string) {
    const module = normalizeModule(moduleKey);
    if (module === 'equipment') return this.reindexEquipment(tenantId);
    if (module === 'actions') return this.reindexActions(tenantId);
    if (module === 'users') return this.reindexUsers(tenantId);
    if (module === 'roles') return this.reindexRoles(tenantId);
    if (module === 'companies') return this.reindexCompanies(tenantId);
    if (module === 'sites') return this.reindexSites(tenantId);
    if (module === 'units') return this.reindexUnits(tenantId);
    if (module === 'areas') return this.reindexAreas(tenantId);
    return { module, indexed: 0 };
  }

  async reindexFoundation(tenantId: string) {
    const modules = ['equipment', 'actions', 'users', 'roles', 'companies', 'sites', 'units', 'areas'];
    const results = [];
    for (const module of modules) results.push(await this.reindexModule(tenantId, module));
    return { modules: results, indexed: results.reduce((sum, result) => sum + result.indexed, 0) };
  }

  private async reindexEquipment(tenantId: string) {
    const rows = await this.db.many<any>(
      this.db.from('Equipment').select('*, site:Site(name,code), unit:Unit(name,code), area:Area(name,code)').eq('tenantId', tenantId)
    );
    for (const equipment of rows) {
      await this.indexEquipment(equipment);
    }
    return { module: 'equipment', indexed: rows.length };
  }

  indexEquipment(equipment: any) {
    return this.indexRecord(equipment.tenantId, {
      module: 'equipment',
      recordType: 'Equipment',
      recordId: equipment.id,
      recordNumber: equipment.tag,
      title: `${equipment.tag} - ${equipment.name}`,
      subtitle: [equipment.type, equipment.site?.name, equipment.unit?.name, equipment.area?.name].filter(Boolean).join(' / '),
      description: equipment.description,
      status: equipment.status,
      priority: equipment.criticality,
      siteId: equipment.siteId,
      url: `/equipment/${equipment.id}`,
      searchableText: normalizeSearchText([
        equipment.tag,
        equipment.name,
        equipment.type,
        equipment.status,
        equipment.manufacturer,
        equipment.model,
        equipment.serialNumber,
        equipment.site?.name,
        equipment.site?.code,
        equipment.unit?.name,
        equipment.unit?.code,
        equipment.area?.name,
        equipment.area?.code
      ]),
      metadata: { manufacturer: equipment.manufacturer, model: equipment.model, serialNumber: equipment.serialNumber }
    });
  }

  private async reindexActions(tenantId: string) {
    const rows = await this.db.many<any>(
      this.db.from('Action').select('*, owner:User!Action_assignedToId_fkey(displayName,email), equipment:Equipment(tag,name)').eq('tenantId', tenantId)
    );
    for (const action of rows) await this.indexAction(action);
    return { module: 'actions', indexed: rows.length };
  }

  indexAction(action: any) {
    return this.indexRecord(action.tenantId, {
      module: 'actions',
      recordType: 'Action',
      recordId: action.id,
      recordNumber: action.actionNumber,
      title: action.title,
      subtitle: [action.owner?.displayName, action.sourceType ?? action.moduleKey, action.equipment?.tag].filter(Boolean).join(' / '),
      description: action.description,
      status: action.status,
      priority: action.priority,
      siteId: action.siteId,
      url: `/actions/${action.id}`,
      searchableText: normalizeSearchText([
        action.actionNumber,
        action.title,
        action.description,
        action.priority,
        action.status,
        action.owner?.displayName,
        action.owner?.email,
        action.sourceType,
        action.moduleKey,
        action.equipment?.tag,
        action.equipment?.name
      ]),
      metadata: { sourceType: action.sourceType, sourceId: action.sourceId, equipmentId: action.equipmentId }
    });
  }

  private async reindexUsers(tenantId: string) {
    const rows = await this.db.many<any>(
      this.db.from('User').select('*, userRoles:UserRole(role:Role(name))').eq('tenantId', tenantId)
    );
    for (const user of rows) {
      await this.indexRecord(tenantId, {
        module: 'users',
        recordType: 'User',
        recordId: user.id,
        recordNumber: user.email,
        title: user.displayName,
        subtitle: [user.title, user.department, user.email].filter(Boolean).join(' / '),
        status: user.status,
        url: `/settings/users/${user.id}`,
        searchableText: normalizeSearchText([user.displayName, user.email, user.department, user.title, ...(user.userRoles ?? []).map((role: any) => role.role?.name)])
      });
    }
    return { module: 'users', indexed: rows.length };
  }

  private async reindexRoles(tenantId: string) {
    const rows = await this.db.many<any>(this.db.from('Role').select('*').eq('tenantId', tenantId));
    for (const role of rows) {
      await this.indexRecord(tenantId, {
        module: 'roles',
        recordType: 'Role',
        recordId: role.id,
        recordNumber: role.name,
        title: role.name,
        subtitle: role.scope,
        description: role.description,
        status: role.system ? 'SYSTEM' : 'CUSTOM',
        url: `/settings/roles/${role.id}`,
        searchableText: normalizeSearchText([role.name, role.description, role.scope])
      });
    }
    return { module: 'roles', indexed: rows.length };
  }

  private async reindexCompanies(tenantId: string) {
    return this.reindexOrgTable(tenantId, 'Company', 'companies', '/settings/units-areas');
  }

  private async reindexSites(tenantId: string) {
    return this.reindexOrgTable(tenantId, 'Site', 'sites', '/settings/units-areas');
  }

  private async reindexUnits(tenantId: string) {
    return this.reindexOrgTable(tenantId, 'Unit', 'units', '/settings/units-areas');
  }

  private async reindexAreas(tenantId: string) {
    return this.reindexOrgTable(tenantId, 'Area', 'areas', '/settings/units-areas');
  }

  private async reindexOrgTable(tenantId: string, table: string, module: string, url: string) {
    const rows = await this.db.many<any>(this.db.from(table).select('*').eq('tenantId', tenantId));
    for (const row of rows) {
      await this.indexRecord(tenantId, {
        module,
        recordType: table,
        recordId: row.id,
        recordNumber: row.code,
        title: row.name,
        subtitle: row.code,
        description: row.description,
        status: row.status,
        siteId: table === 'Site' ? row.id : row.siteId,
        url,
        searchableText: normalizeSearchText([row.name, row.code, row.description, row.status])
      });
    }
    return { module, indexed: rows.length };
  }
}

export function normalizeSearchText(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeModule(moduleKey: string) {
  return moduleKey.trim().toLowerCase();
}

function defaultUrl(moduleKey: string, recordId: string) {
  if (moduleKey === 'equipment') return `/equipment/${recordId}`;
  if (moduleKey === 'actions') return `/actions/${recordId}`;
  if (moduleKey === 'users') return `/settings/users/${recordId}`;
  if (moduleKey === 'roles') return `/settings/roles/${recordId}`;
  if (['companies', 'sites', 'units', 'areas'].includes(moduleKey)) return '/settings/units-areas';
  return '/search';
}
