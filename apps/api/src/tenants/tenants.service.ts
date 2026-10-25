import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { FoundationEntityDto } from './dto/foundation-entity.dto';
import { TenantAuditService } from './tenant-audit.service';

@Injectable()
export class TenantsService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly tenantAudit: TenantAuditService
  ) {}

  getSiteTree(tenantId: string) {
    return this.db.single(this.db.from('Tenant').select('*, sites:Site(*, units:Unit(*, areas:Area(*)))').eq('id', tenantId).maybeSingle());
  }

  async context(user: RequestUser) {
    const [companies, sites] = await Promise.all([
      this.listCompanies(user.tenantId),
      this.db.many<any>(
        this.db.from('Site')
          .select('*, company:Company(*)')
          .eq('tenantId', user.tenantId)
          .in('id', user.siteIds.length ? user.siteIds : ['__none__'])
          .order('name')
      )
    ]);
    return {
      tenantId: user.tenantId,
      companyIds: user.companyIds,
      siteIds: user.siteIds,
      activeCompanyId: user.activeCompanyId ?? user.companyIds[0] ?? null,
      activeSiteId: user.activeSiteId ?? user.selectedSiteId ?? null,
      selectedSiteId: user.selectedSiteId,
      corporateView: Boolean(user.corporateView),
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      isSuperAdmin: Boolean(user.isSuperAdmin),
      isCompanyAdmin: Boolean(user.isCompanyAdmin),
      isSiteAdmin: Boolean(user.isSiteAdmin),
      companies: user.corporateView ? companies : companies.filter((company: any) => user.companyIds.includes(company.id)),
      sites
    };
  }

  async allowedCompanies(user: RequestUser) {
    const context = await this.context(user);
    return context.companies;
  }

  listCompanies(tenantId: string) {
    return this.db.many(this.db.from('Company').select('*').eq('tenantId', tenantId).order('name'));
  }

  listSites(tenantId: string) {
    return this.db.many(this.db.from('Site').select('*, company:Company(*)').eq('tenantId', tenantId).order('name'));
  }

  listDepartments(tenantId: string) {
    return this.db.many(this.db.from('Department').select('*, site:Site(*)').eq('tenantId', tenantId).order('name'));
  }

  listUnits(tenantId: string) {
    return this.db.many(this.db.from('Unit').select('*, site:Site(*)').eq('tenantId', tenantId).order('name'));
  }

  listAreas(tenantId: string) {
    return this.db.many(this.db.from('Area').select('*, unit:Unit(*, site:Site(*))').eq('tenantId', tenantId).order('name'));
  }

  createCompany(tenantId: string, actorId: string, dto: FoundationEntityDto) {
    return this.createEntity(tenantId, actorId, 'Company', {
      id: crypto.randomUUID(),
      tenantId,
      name: dto.name,
      legalName: dto.legalName ?? dto.name,
      code: dto.code ?? dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24),
      slug: dto.slug ?? this.slugify(dto.code ?? dto.name),
      industry: dto.industry ?? null,
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      currency: dto.currency ?? null,
      logoUrl: dto.logoUrl ?? null,
      address: dto.address ?? null,
      phone: dto.phone ?? null,
      website: dto.website ?? null,
      status: dto.status ?? 'ACTIVE',
      onboardingStatus: 'IN_PROGRESS',
      createdBy: actorId,
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    }, 'COMPANY_CREATED');
  }

  updateCompany(tenantId: string, actorId: string, id: string, dto: FoundationEntityDto) {
    return this.updateEntity(tenantId, actorId, 'Company', id, this.patch(dto, ['name', 'legalName', 'code', 'slug', 'industry', 'country', 'timezone', 'currency', 'logoUrl', 'address', 'phone', 'website', 'status', 'displayName']), 'COMPANY_UPDATED');
  }

  createSite(tenantId: string, actorId: string, dto: FoundationEntityDto) {
    return this.createEntity(tenantId, actorId, 'Site', {
      id: crypto.randomUUID(),
      tenantId,
      companyId: dto.companyId ?? null,
      name: dto.name,
      code: dto.code ?? dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24),
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      address: dto.address ?? null,
      siteManagerId: dto.siteManagerId ?? null,
      emergencyContact: this.emergencyContact(dto),
      status: dto.status ?? 'ACTIVE'
    }, 'SITE_CREATED');
  }

  updateSite(tenantId: string, actorId: string, id: string, dto: FoundationEntityDto) {
    const data = this.patch(dto, ['companyId', 'name', 'code', 'country', 'timezone', 'address', 'siteManagerId', 'status']);
    if (dto.emergencyContact !== undefined || dto.emergencyContactName !== undefined || dto.emergencyContactPhone !== undefined || dto.emergencyContactEmail !== undefined) {
      data.emergencyContact = this.emergencyContact(dto);
    }
    return this.updateEntity(tenantId, actorId, 'Site', id, data, 'SITE_UPDATED');
  }

  createDepartment(tenantId: string, actorId: string, dto: FoundationEntityDto) {
    return this.createEntity(tenantId, actorId, 'Department', {
      id: crypto.randomUUID(),
      tenantId,
      siteId: dto.siteId ?? null,
      name: dto.name,
      code: dto.code ?? dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24),
      managerId: dto.managerId ?? null,
      description: dto.description ?? null,
      status: dto.status ?? 'ACTIVE',
      updatedAt: new Date().toISOString()
    }, 'DEPARTMENT_CREATED');
  }

  updateDepartment(tenantId: string, actorId: string, id: string, dto: FoundationEntityDto) {
    return this.updateEntity(tenantId, actorId, 'Department', id, this.patch(dto, ['siteId', 'name', 'code', 'managerId', 'description', 'status']), 'DEPARTMENT_UPDATED');
  }

  createUnit(tenantId: string, actorId: string, dto: FoundationEntityDto) {
    const opStatus = dto.operatingStatus ?? 'IN_SERVICE';
    return this.createEntity(tenantId, actorId, 'Unit', {
      id: crypto.randomUUID(),
      tenantId,
      siteId: dto.siteId,
      departmentId: dto.departmentId ?? null,
      name: dto.name,
      code: dto.code ?? dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24),
      description: dto.description ?? null,
      status: dto.status ?? 'ACTIVE',
      operatingStatus: opStatus,
      operating_status: opStatus,
      unitManagerId: dto.unitManagerId ?? null,
      unit_manager_id: dto.unitManagerId ?? null
    }, 'UNIT_CREATED');
  }

  updateUnit(tenantId: string, actorId: string, id: string, dto: FoundationEntityDto) {
    const patchData: Record<string, any> = this.patch(dto, ['siteId', 'departmentId', 'name', 'code', 'description', 'status']);
    if (dto.operatingStatus !== undefined) {
      patchData.operatingStatus = dto.operatingStatus;
      patchData.operating_status = dto.operatingStatus;
    }
    if (dto.unitManagerId !== undefined) {
      patchData.unitManagerId = dto.unitManagerId;
      patchData.unit_manager_id = dto.unitManagerId;
    }
    return this.updateEntity(tenantId, actorId, 'Unit', id, patchData, 'UNIT_UPDATED');
  }

  createArea(tenantId: string, actorId: string, dto: FoundationEntityDto) {
    return this.createEntity(tenantId, actorId, 'Area', {
      id: crypto.randomUUID(),
      tenantId,
      siteId: dto.siteId ?? null,
      unitId: dto.unitId,
      name: dto.name,
      code: dto.code ?? dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 24),
      description: dto.description ?? null,
      status: dto.status ?? 'ACTIVE',
      areaAuthorityUserId: dto.areaAuthorityUserId ?? null,
      area_authority_user_id: dto.areaAuthorityUserId ?? null
    }, 'AREA_CREATED');
  }

  updateArea(tenantId: string, actorId: string, id: string, dto: FoundationEntityDto) {
    const patchData: Record<string, any> = this.patch(dto, ['siteId', 'unitId', 'name', 'code', 'description', 'status']);
    if (dto.areaAuthorityUserId !== undefined) {
      patchData.areaAuthorityUserId = dto.areaAuthorityUserId;
      patchData.area_authority_user_id = dto.areaAuthorityUserId;
    }
    return this.updateEntity(tenantId, actorId, 'Area', id, patchData, 'AREA_UPDATED');
  }

  async getCompanySettings(tenantId: string, companyId?: string | null) {
    const company = await this.currentCompany(tenantId, companyId);
    const settings = await this.db.single<any>(
      this.db.from('CompanySetting').select('*').eq('tenantId', tenantId).eq('companyId', company.id).maybeSingle()
    ).catch(() => null);
    return { company, settings: settings ?? await this.ensureCompanySettings(tenantId, company.id) };
  }

  async updateCompanySettings(tenantId: string, actorId: string, dto: FoundationEntityDto, companyId?: string | null) {
    const company = await this.currentCompany(tenantId, companyId);
    const before = await this.ensureCompanySettings(tenantId, company.id);
    const patch = {
      defaultTimezone: dto.timezone ?? before.defaultTimezone,
      defaultCurrency: dto.currency ?? before.defaultCurrency,
      dateFormat: dto.dateFormat ?? before.dateFormat,
      timeFormat: dto.timeFormat ?? before.timeFormat,
      language: dto.language ?? before.language,
      allowGoogleLogin: dto.allowGoogleLogin ?? before.allowGoogleLogin,
      allowDomainAutoJoin: dto.allowDomainAutoJoin ?? before.allowDomainAutoJoin,
      requireMfa: dto.requireMfa ?? before.requireMfa,
      requireESignature: dto.requireESignature ?? before.requireESignature,
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    };
    const settings = await this.db.single<any>(
      this.db.from('CompanySetting').update(patch).eq('tenantId', tenantId).eq('companyId', company.id).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'COMPANY_SETTINGS_UPDATED', entityType: 'CompanySetting', entityId: settings.id, before: before as JsonValue, after: settings as JsonValue });
    return { company, settings };
  }

  async listDomains(tenantId: string, companyId?: string | null) {
    const company = await this.currentCompany(tenantId, companyId);
    return this.db.many(this.db.from('CompanyDomain').select('*').eq('tenantId', tenantId).eq('companyId', company.id).order('domain'));
  }

  async createDomain(tenantId: string, actorId: string, dto: FoundationEntityDto, companyId?: string | null) {
    const company = await this.currentCompany(tenantId, dto.companyId ?? companyId);
    if (!dto.domain) throw new BadRequestException('Domain name is required');
    const domain = dto.domain.toLowerCase().trim();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new BadRequestException('Domain format is invalid');
    const token = crypto.randomUUID();
    const record = await this.createEntity(tenantId, actorId, 'CompanyDomain', {
      id: crypto.randomUUID(),
      tenantId,
      companyId: company.id,
      domain,
      verificationStatus: 'PENDING',
      verificationMethod: dto.verificationMethod ?? 'DNS_TXT',
      verificationTokenHash: token,
      allowGoogleLogin: dto.allowGoogleLogin ?? false,
      allowAutoJoin: dto.allowDomainAutoJoin ?? false,
      domainOwnerEmail: dto.domainOwnerEmail ?? null,
      status: dto.status ?? 'ACTIVE',
      notes: dto.notes ?? null,
      createdBy: actorId,
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    }, 'COMPANY_DOMAIN_ADDED');
    return { ...record, verificationToken: token };
  }

  updateDomain(tenantId: string, actorId: string, domainId: string, dto: FoundationEntityDto) {
    const data = this.patch(dto, ['domain', 'verificationMethod', 'status', 'notes', 'domainOwnerEmail']);
    if (dto.allowGoogleLogin !== undefined) data.allowGoogleLogin = dto.allowGoogleLogin;
    if (dto.allowDomainAutoJoin !== undefined) data.allowAutoJoin = dto.allowDomainAutoJoin;
    data.updatedBy = actorId;
    return this.updateEntity(tenantId, actorId, 'CompanyDomain', domainId, data, 'COMPANY_DOMAIN_UPDATED');
  }

  async verifyDomain(tenantId: string, actorId: string, domainId: string) {
    return this.updateEntity(tenantId, actorId, 'CompanyDomain', domainId, {
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: actorId,
      updatedBy: actorId
    }, 'COMPANY_DOMAIN_VERIFIED');
  }

  archiveDomain(tenantId: string, actorId: string, domainId: string, reason?: string) {
    return this.updateEntity(tenantId, actorId, 'CompanyDomain', domainId, {
      status: 'ARCHIVED',
      notes: reason ?? null,
      updatedBy: actorId
    }, 'COMPANY_DOMAIN_ARCHIVED');
  }

  archiveEntity(tenantId: string, actorId: string, table: 'Site' | 'Department' | 'Unit' | 'Area', id: string, reason?: string) {
    return this.updateEntity(tenantId, actorId, table, id, { status: 'ARCHIVED', deletedAt: new Date().toISOString(), deletionReason: reason ?? null }, `${table.toUpperCase()}_ARCHIVED`);
  }

  async switchCompany(user: RequestUser, companyId: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    if (!user.corporateView && !user.companyIds.includes(companyId)) throw new ForbiddenException('Company is outside the current user access scope');
    const site = user.selectedSiteId
      ? await this.db.single<any>(this.db.from('Site').select('id,companyId').eq('tenantId', user.tenantId).eq('id', user.selectedSiteId).maybeSingle()).catch(() => null)
      : null;
    const nextSiteId = site?.companyId === companyId ? user.selectedSiteId ?? null : null;
    await this.persistActiveContext(user.tenantId, user.id, companyId, nextSiteId);
    await this.tenantAudit.writeContextSwitch({
      tenantId: user.tenantId,
      userId: user.id,
      eventType: 'COMPANY_SWITCH',
      previousCompanyId: user.activeCompanyId ?? user.companyIds[0] ?? null,
      previousSiteId: user.selectedSiteId ?? null,
      companyId,
      siteId: nextSiteId,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null
    });
    return { companyId, siteId: nextSiteId };
  }

  async switchSite(user: RequestUser, siteId: string | null, meta?: { ip?: string | null; userAgent?: string | null }) {
    if (siteId && !user.corporateView && !user.siteIds.includes(siteId)) throw new ForbiddenException('Site is outside the current user access scope');
    const site = siteId ? await this.db.single<any>(this.db.from('Site').select('id,companyId').eq('tenantId', user.tenantId).eq('id', siteId).maybeSingle()) : null;
    const companyId = site?.companyId ?? user.activeCompanyId ?? user.companyIds[0] ?? null;
    if (siteId && companyId && !user.corporateView && !user.companyIds.includes(companyId)) throw new ForbiddenException('Site company is outside the current user access scope');
    await this.persistActiveContext(user.tenantId, user.id, companyId, siteId);
    await this.tenantAudit.writeContextSwitch({
      tenantId: user.tenantId,
      userId: user.id,
      eventType: 'SITE_SWITCH',
      previousCompanyId: user.activeCompanyId ?? user.companyIds[0] ?? null,
      previousSiteId: user.selectedSiteId ?? null,
      companyId,
      siteId,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null
    });
    return { companyId, siteId };
  }

  async securityEvents(user: RequestUser) {
    return this.db.many(
      this.db.from('UserContextSwitchEvent')
        .select('*')
        .eq('tenantId', user.tenantId)
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50)
    ).catch(() => []);
  }

  async tenantContextDebug(user: RequestUser) {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      companyIds: user.companyIds,
      siteIds: user.siteIds,
      activeCompanyId: user.activeCompanyId ?? null,
      activeSiteId: user.activeSiteId ?? user.selectedSiteId ?? null,
      roles: user.roles,
      permissionCount: user.permissions?.length ?? 0,
      tenantContext: user.tenantContext ?? null
    };
  }

  async completeOnboarding(user: RequestUser, dto: FoundationEntityDto) {
    const company = await this.currentCompany(user.tenantId, dto.companyId ?? user.companyIds[0]);
    const updated = await this.updateEntity(user.tenantId, user.id, 'Company', company.id, {
      onboardingStatus: 'COMPLETED',
      status: dto.status ?? company.status ?? 'ACTIVE',
      updatedBy: user.id
    }, 'ONBOARDING_COMPLETED');
    return { company: updated };
  }

  private async createEntity(tenantId: string, actorId: string, table: string, data: Record<string, unknown>, action: string) {
    const record = await this.db.single<any>(this.db.from(table).insert(data).select().single());
    await this.audit.write({ tenantId, actorId, action, entityType: table, entityId: record.id, after: record as JsonValue });
    return record;
  }

  private async updateEntity(tenantId: string, actorId: string, table: string, id: string, data: Record<string, unknown>, action: string) {
    const before = await this.db.single<any>(this.db.from(table).select('*').eq('tenantId', tenantId).eq('id', id).maybeSingle());
    if (!before) throw new NotFoundException(`${table} record was not found`);
    const record = await this.db.single<any>(this.db.from(table).update({ ...data, updatedAt: new Date().toISOString() }).eq('tenantId', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action, entityType: table, entityId: id, before: before as JsonValue, after: record as JsonValue });
    return record;
  }

  private patch(dto: FoundationEntityDto, keys: Array<keyof FoundationEntityDto>) {
    return keys.reduce<Record<string, unknown>>((acc, key) => {
      if (dto[key] !== undefined) acc[key] = dto[key];
      return acc;
    }, {});
  }

  private async currentCompany(tenantId: string, companyId?: string | null) {
    const query = this.db.from('Company').select('*').eq('tenantId', tenantId);
    const company = await this.db.single<any>((companyId ? query.eq('id', companyId) : query.order('createdAt').limit(1)).maybeSingle());
    if (!company) throw new NotFoundException('Company workspace was not found');
    return company;
  }

  private async ensureCompanySettings(tenantId: string, companyId: string) {
    const existing = await this.db.single<any>(this.db.from('CompanySetting').select('*').eq('tenantId', tenantId).eq('companyId', companyId).maybeSingle()).catch(() => null);
    if (existing) return existing;
    return this.db.single<any>(this.db.from('CompanySetting').insert({
      id: crypto.randomUUID(),
      tenantId,
      companyId,
      defaultTimezone: 'UTC',
      defaultCurrency: 'USD',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      language: 'en',
      allowGoogleLogin: false,
      allowDomainAutoJoin: false,
      requireMfa: false,
      requireESignature: false
    }).select().single());
  }

  private async persistActiveContext(tenantId: string, userId: string, companyId?: string | null, siteId?: string | null) {
    const existing = await this.db.single<any>(
      this.db.from('UserActiveContext')
        .select('id')
        .eq('tenantId', tenantId)
        .eq('userId', userId)
        .maybeSingle()
    ).catch(() => null);
    const data = {
      tenantId,
      userId,
      activeCompanyId: companyId ?? null,
      activeSiteId: siteId ?? null,
      updatedAt: new Date().toISOString()
    };
    if (existing?.id) {
      return this.db.single(this.db.from('UserActiveContext').update(data).eq('id', existing.id).select().single()).catch(() => null);
    }
    return this.db.single(this.db.from('UserActiveContext').insert({ id: crypto.randomUUID(), ...data }).select().single()).catch(() => null);
  }

  private emergencyContact(dto: FoundationEntityDto) {
    if (dto.emergencyContact) return dto.emergencyContact;
    const values = [dto.emergencyContactName, dto.emergencyContactPhone, dto.emergencyContactEmail].filter(Boolean);
    return values.length ? values.join(' | ') : null;
  }

  async getHierarchyTree(tenantId: string) {
    const [companies, sites, departments, units, areas, users] = await Promise.all([
      this.db.many<any>(this.db.from('Company').select('*').eq('tenantId', tenantId).order('name')).catch(() => []),
      this.db.many<any>(this.db.from('Site').select('*').eq('tenantId', tenantId).order('name')).catch(() => []),
      this.db.many<any>(this.db.from('Department').select('*').eq('tenantId', tenantId).order('name')).catch(() => []),
      this.db.many<any>(this.db.from('Unit').select('*').eq('tenantId', tenantId).order('name')).catch(() => []),
      this.db.many<any>(this.db.from('Area').select('*').eq('tenantId', tenantId).order('name')).catch(() => []),
      this.db.many<any>(this.db.from('User').select('id,email,displayName,title').eq('tenantId', tenantId)).catch(() => [])
    ]);

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const areasWithAuthority = areas.map((area: any) => ({
      ...area,
      authority: area.areaAuthorityUserId ? userMap.get(area.areaAuthorityUserId) ?? null : null
    }));

    const unitsWithChildren = units.map((unit: any) => ({
      ...unit,
      operatingStatus: unit.operatingStatus ?? unit.operating_status ?? 'IN_SERVICE',
      manager: unit.unitManagerId ? userMap.get(unit.unitManagerId) ?? null : null,
      areas: areasWithAuthority.filter((a: any) => a.unitId === unit.id)
    }));

    const sitesWithChildren = sites.map((site: any) => ({
      ...site,
      departments: departments.filter((d: any) => d.siteId === site.id),
      units: unitsWithChildren.filter((u: any) => u.siteId === site.id)
    }));

    const tree = companies.map((comp: any) => ({
      ...comp,
      sites: sitesWithChildren.filter((s: any) => s.companyId === comp.id || (!comp.id && !s.companyId))
    }));

    return {
      tree,
      summary: {
        totalCompanies: companies.length,
        totalSites: sites.length,
        totalDepartments: departments.length,
        totalUnits: units.length,
        totalAreas: areas.length
      }
    };
  }

  async listNumberingRules(tenantId: string) {
    try {
      const rows = await this.db.many<any>(
        this.db.from('tenant_numbering_rules').select('*').eq('tenant_id', tenantId).order('module_key')
      );
      if (rows.length) return rows;
    } catch {}

    const defaults = [
      { module_key: 'ptw', prefix: 'PTW', include_site_code: true, include_year: true, digits: 4, current_sequence: 1, sample_preview: 'PTW-SITE-2026-0001' },
      { module_key: 'moc', prefix: 'MOC', include_site_code: true, include_year: true, digits: 4, current_sequence: 1, sample_preview: 'MOC-SITE-2026-0001' },
      { module_key: 'actions', prefix: 'CAPA', include_site_code: false, include_year: true, digits: 5, current_sequence: 1, sample_preview: 'CAPA-2026-00001' },
      { module_key: 'incidents', prefix: 'INC', include_site_code: true, include_year: true, digits: 4, current_sequence: 1, sample_preview: 'INC-SITE-2026-0001' },
      { module_key: 'documents', prefix: 'DOC', include_site_code: true, include_year: false, digits: 4, current_sequence: 1, sample_preview: 'DOC-SITE-0001' },
      { module_key: 'equipment', prefix: 'EQ', include_site_code: true, include_year: false, digits: 5, current_sequence: 1, sample_preview: 'EQ-SITE-00001' },
      { module_key: 'pssr', prefix: 'PSSR', include_site_code: true, include_year: true, digits: 4, current_sequence: 1, sample_preview: 'PSSR-SITE-2026-0001' }
    ];

    try {
      for (const item of defaults) {
        await this.db.single(
          this.db.from('tenant_numbering_rules').insert({ id: crypto.randomUUID(), tenant_id: tenantId, ...item }).select().single()
        ).catch(() => null);
      }
      return await this.db.many<any>(
        this.db.from('tenant_numbering_rules').select('*').eq('tenant_id', tenantId).order('module_key')
      ).catch(() => defaults);
    } catch {
      return defaults;
    }
  }

  async updateNumberingRule(tenantId: string, moduleKey: string, input: { prefix: string; include_site_code?: boolean; include_year?: boolean; digits?: number }) {
    const digits = Math.max(3, Math.min(8, Number(input.digits ?? 4)));
    const sample = `${input.prefix}-${input.include_site_code !== false ? 'SITE-' : ''}${input.include_year !== false ? new Date().getFullYear() + '-' : ''}${'1'.padStart(digits, '0')}`;
    const payload = {
      tenant_id: tenantId,
      module_key: moduleKey,
      prefix: input.prefix.toUpperCase().trim(),
      include_site_code: input.include_site_code !== false,
      include_year: input.include_year !== false,
      digits,
      sample_preview: sample,
      updated_at: new Date().toISOString()
    };
    try {
      return await this.db.single(
        this.db.from('tenant_numbering_rules')
          .upsert(payload, { onConflict: 'tenant_id,module_key' })
          .select()
          .single()
      );
    } catch {
      return payload;
    }
  }

  async getRiskMatrixConfig(tenantId: string) {
    try {
      const matrix = await this.db.single<any>(
        this.db.from('hazop_risk_matrices').select('*, levels:hazop_risk_matrix_levels(*)').eq('tenant_id', tenantId).maybeSingle()
      ).catch(() => null);

      if (matrix && matrix.levels?.length) {
        return matrix;
      }
    } catch {}

    const severities = [
      { level: 1, label: 'Negligible', description: 'Minor injury or negligible process deviation' },
      { level: 2, label: 'Minor', description: 'First aid treatment or minor contained release' },
      { level: 3, label: 'Moderate', description: 'Lost time injury or release contained on-site' },
      { level: 4, label: 'Major', description: 'Permanent disability or release with off-site alert' },
      { level: 5, label: 'Catastrophic', description: 'Fatality or massive toxic release off-site' }
    ];

    const likelihoods = [
      { level: 1, label: 'Improbable', description: '< 10^-5 per year (extremely unlikely)' },
      { level: 2, label: 'Remote', description: '10^-4 to 10^-5 per year' },
      { level: 3, label: 'Occasional', description: '10^-3 to 10^-4 per year' },
      { level: 4, label: 'Probable', description: '10^-2 to 10^-3 per year' },
      { level: 5, label: 'Frequent', description: '> 10^-2 per year (expected in plant life)' }
    ];

    return {
      id: 'default-5x5',
      name: 'OSHA 1910.119 Standard 5x5 Risk Matrix',
      matrix_type: '5x5',
      severities,
      likelihoods,
      riskTiers: [
        { key: 'LOW', label: 'Low Risk', color: '#10b981', action: 'Broadly acceptable with standard operating procedures' },
        { key: 'MEDIUM', label: 'Medium Risk', color: '#f59e0b', action: 'Manageable with specific engineering safeguards' },
        { key: 'HIGH', label: 'High Risk', color: '#f97316', action: 'Requires PHA recommendation and MOC review' },
        { key: 'CRITICAL', label: 'Critical Risk', color: '#ef4444', action: 'Unacceptable; requires SIL/LOPA IPL and VP authorization' }
      ]
    };
  }

  async saveRiskMatrixConfig(tenantId: string, input: any) {
    const payload = {
      tenant_id: tenantId,
      name: input.name ?? 'OSHA 1910.119 Standard 5x5 Risk Matrix',
      matrix_type: '5x5',
      active: true,
      updated_at: new Date().toISOString()
    };
    try {
      const existing = await this.db.single<any>(
        this.db.from('hazop_risk_matrices').select('id').eq('tenant_id', tenantId).maybeSingle()
      ).catch(() => null);

      if (existing?.id) {
        return await this.db.single(
          this.db.from('hazop_risk_matrices').update(payload).eq('id', existing.id).select().single()
        );
      } else {
        return await this.db.single(
          this.db.from('hazop_risk_matrices').insert({ id: crypto.randomUUID(), ...payload }).select().single()
        );
      }
    } catch {
      return { ...payload, id: 'updated' };
    }
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }
}
