import { describe, expect, it, vi, beforeEach } from 'vitest';
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutiveCriticalRiskService } from '../src/executive/executive-critical-risk.service.ts';

const user = {
  id: 'user-admin',
  tenantId: 'company-psm-1',
  companyIds: ['company-psm-1'],
  selectedSiteId: 'site-alpha',
  siteIds: ['site-alpha'],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    'executive.critical_risk.view',
    'executive.critical_risk.dashboard.view',
    'executive.critical_risk.register.view',
    'executive.critical_risk.detail.view',
    'executive.critical_risk.recalculate',
    'executive.critical_risk.acknowledge',
    'executive.critical_risk.owner.assign',
    'executive.critical_risk.action.create',
    'executive.critical_risk.action.link',
    'executive.critical_risk.verification.request',
    'executive.critical_risk.case.close',
    'executive.critical_risk.restricted.view',
    'executive.overdue_action.view',
    'executive.overdue_action.dashboard.view',
    'executive.overdue_action.register.view',
    'executive.overdue_action.detail.view',
    'executive.overdue_action.owner.view',
    'executive.escalation.view',
    'executive.escalation.dashboard.view',
    'executive.escalation.register.view',
    'executive.escalation.detail.view',
    'executive.escalation.create',
    'executive.escalation.acknowledge',
    'executive.escalation.decision.create',
    'executive.escalation.close',
    'executive.escalation.reassign',
    'executive.escalation.level.increase',
    'executive.escalation.cancel',
    'executive.escalation.rule.view',
    'executive.escalation.rule.create',
    'executive.escalation.rule.edit',
    'executive.escalation.rule.approve',
    'executive.escalation.rule.archive',
    'executive.leadership_attention.view',
    'executive.critical_risk.history.view'
  ]
} as any;

function createMocks() {
  const store: Record<string, any[]> = {
    executive_risk_cases: [],
    executive_overdue_action_snapshots: [],
    executive_escalations: [],
    executive_risk_aggregation_runs: [],
    executive_risk_case_source_links: [],
    executive_risk_case_action_links: [],
    executive_risk_case_acknowledgments: [],
    executive_management_decisions: [],
    executive_risk_verification_records: [],
    executive_escalation_events: [],
    executive_risk_case_ownership_history: [],
    executive_escalation_rules: [],
    executive_risk_history_events: [],
    User: [
      { id: 'user-ops', tenantId: 'company-psm-1', status: 'ACTIVE', name: 'Ops Lead' },
      { id: 'user-admin', tenantId: 'company-psm-1', status: 'ACTIVE', name: 'Admin Lead' },
      { id: 'user-inactive', tenantId: 'company-psm-1', status: 'SUSPENDED', name: 'Suspended User' },
      { id: 'user-other-tenant', tenantId: 'company-other', status: 'ACTIVE', name: 'Other User' }
    ],
    Action: [
      { id: 'act-101', tenantId: 'company-psm-1', siteId: 'site-alpha', status: 'OPEN', moduleKey: 'incident' },
      { id: 'act-other-site', tenantId: 'company-psm-1', siteId: 'site-beta', status: 'OPEN', moduleKey: 'ptw' }
    ]
  };

  const createQueryBuilder = (table: string) => {
    let currentData = store[table] ? [...store[table]] : [];
    let isCountQuery = false;
    let pendingInsert: any = null;
    let pendingUpdate: any = null;
    let pendingUpsert: any = null;

    const builder: any = {
      select: vi.fn((fields?: string, opts?: any) => {
        if (opts?.count === 'exact') isCountQuery = true;
        return builder;
      }),
      insert: vi.fn((data: any) => {
        pendingInsert = data;
        return builder;
      }),
      update: vi.fn((data: any) => {
        pendingUpdate = data;
        return builder;
      }),
      upsert: vi.fn((data: any) => {
        pendingUpsert = data;
        return builder;
      }),
      eq: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((r) => r[field] === val);
        return builder;
      }),
      gt: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((r) => Number(r[field] ?? 0) > Number(val));
        return builder;
      }),
      is: vi.fn((field: string, val: any) => {
        if (val === null) currentData = currentData.filter((r) => r[field] === null || r[field] === undefined);
        else currentData = currentData.filter((r) => r[field] === val);
        return builder;
      }),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn((start: number, end: number) => {
        const slice = currentData.slice(start, end + 1);
        return Promise.resolve({ data: slice, count: currentData.length, error: null });
      }),
      maybeSingle: vi.fn(() => {
        return Promise.resolve(currentData.length > 0 ? currentData[0] : null);
      }),
      single: vi.fn(() => {
        if (pendingInsert) {
          const item = Array.isArray(pendingInsert) ? pendingInsert[0] : pendingInsert;
          if (!store[table]) store[table] = [];
          store[table].push(item);
          return Promise.resolve(item);
        }
        if (pendingUpsert) {
          const item = Array.isArray(pendingUpsert) ? pendingUpsert[0] : pendingUpsert;
          if (!store[table]) store[table] = [];
          const idx = store[table].findIndex((r) => r.id === item.id);
          if (idx >= 0) store[table][idx] = { ...store[table][idx], ...item };
          else store[table].push(item);
          return Promise.resolve(item);
        }
        if (pendingUpdate) {
          if (currentData.length > 0) {
            const id = currentData[0].id;
            const idx = store[table].findIndex((r) => r.id === id);
            if (idx >= 0) {
              store[table][idx] = { ...store[table][idx], ...pendingUpdate };
              return Promise.resolve(store[table][idx]);
            }
          }
          return Promise.resolve({ ...pendingUpdate });
        }
        return Promise.resolve(currentData[0] ?? null);
      })
    };
    return builder;
  };

  const mockDb = {
    from: vi.fn((table: string) => createQueryBuilder(table)),
    single: vi.fn(async (promise: any) => promise),
    many: vi.fn(async (query: any) => {
      const res = await query.range(0, 9999);
      return res.data ?? [];
    })
  } as any;

  const mockAudit = {
    write: vi.fn().mockResolvedValue(true)
  } as any;

  const mockAggregation = {
    scope: vi.fn((u: any, q: any = {}) => ({
      companyId: u.tenantId,
      siteId: q.siteId ?? u.selectedSiteId ?? null,
      unitId: q.unitId ?? null
    }))
  } as any;

  const mockAdapters = {
    aggregateAll: vi.fn().mockResolvedValue([
      {
        moduleKey: 'mechanical-integrity',
        adapterStatus: 'healthy',
        warnings: [],
        errors: [],
        criticalItems: [
          {
            sourceRecordType: 'equipment_deficiency',
            sourceRecordId: 'eq-999',
            title: 'Critical SIS Valve Failing Test',
            severity: 'Critical',
            criticality: 'Safety-Critical',
            siteId: 'site-alpha',
            status: 'OPEN'
          }
        ],
        overdueItems: [
          {
            sourceRecordId: 'act-overdue-1',
            severity: 'Critical',
            dueDate: '2026-09-01T00:00:00.000Z',
            overdueDays: 45,
            status: 'OPEN',
            siteId: 'site-alpha',
            ownerUserId: 'user-ops'
          }
        ]
      }
    ])
  } as any;

  const mockActions = {
    create: vi.fn().mockImplementation((tenantId, userId, dto) => Promise.resolve({
      id: 'act-new-1',
      tenantId,
      ...dto
    }))
  } as any;

  const mockNotifications = {
    notifyUser: vi.fn().mockResolvedValue(true)
  } as any;

  const service = new ExecutiveCriticalRiskService(
    mockDb,
    mockAudit,
    mockAggregation,
    mockAdapters,
    mockActions,
    mockNotifications
  );

  return { service, store, mockDb, mockAudit, mockAdapters, mockActions, mockNotifications };
}

describe('ExecutiveCriticalRiskService', () => {
  it('lookups returns standard configuration lists', () => {
    const { service } = createMocks();
    expect(service.lookups('risk-case-statuses')).toContain('Open');
    expect(service.lookups('risk-case-statuses')).toContain('Awaiting Verification');
    expect(service.lookups('risk-priority-levels')).toContain('Critical');
    expect(service.lookups('barrier-statuses')).toContain('Impaired');
    expect(service.lookups('escalation-levels')).toEqual(
      expect.arrayContaining([{ level: 0, label: 'Owner Follow-Up' }, { level: 5, label: 'Executive Leadership' }])
    );
    expect(service.lookups('unknown')).toEqual([]);
  });

  it('recalculates risk aggregation and upserts critical cases & overdue snapshots', async () => {
    const { service, store } = createMocks();
    const result = await service.recalculate(user, { siteId: 'site-alpha' });

    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].canonical_source_key).toBe('mechanical-integrity:equipment_deficiency:eq-999');
    expect(result.cases[0].executive_priority).toBe('Critical');
    expect(result.overdueActionSnapshots).toHaveLength(1);
    expect(store.executive_risk_cases).toHaveLength(1);
    expect(store.executive_overdue_action_snapshots).toHaveLength(1);
  });

  it('generates dashboard metrics and summaries correctly', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-1',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      case_title: 'Uncontained Flammable Release Risk',
      case_status: 'Open',
      executive_priority: 'Critical',
      acknowledgment_status: 'Unacknowledged',
      pending_verification_count: 0
    });
    store.executive_escalations.push({
      id: 'esc-1',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      escalation_status: 'Active',
      escalation_level: 2
    });
    store.executive_overdue_action_snapshots.push({
      id: 'snap-1',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      extension_count: 1
    });

    const res = await service.dashboard(user, { siteId: 'site-alpha' });
    expect(res.summary.openCriticalRisks).toBe(1);
    expect(res.summary.unacknowledgedRisks).toBe(1);
    expect(res.summary.activeEscalations).toBe(1);
    expect(res.summary.repeatedOverdueActions).toBe(1);
    expect(res.attention).toHaveLength(1);
  });

  it('acknowledges an open critical risk case', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-ack',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      case_status: 'Open',
      acknowledgment_status: 'Unacknowledged'
    });

    const updated = await service.acknowledge(user, 'case-ack', { note: 'Under management review' });
    expect(updated.acknowledgment_status).toBe('Acknowledged');
    expect(store.executive_risk_case_acknowledgments).toHaveLength(1);
  });

  it('rejects assigning owner when user does not exist or is inactive', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-owner',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      case_status: 'Open'
    });

    await expect(service.assignOwner(user, 'case-owner', { ownerId: 'user-inactive', reason: 'Lead' }))
      .rejects.toThrow('The selected owner is not an active user in this company.');

    await expect(service.assignOwner(user, 'case-owner', { ownerId: 'user-other-tenant', reason: 'Lead' }))
      .rejects.toThrow('The selected owner is not an active user in this company.');
  });

  it('assigns owner when user is valid and writes audit/history', async () => {
    const { service, store, mockNotifications } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-owner-valid',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      case_status: 'Open',
      executive_owner_user_id: null
    });

    const after = await service.assignOwner(user, 'case-owner-valid', { ownerId: 'user-ops', reason: 'Direct operational responsibility' });
    expect(after.executive_owner_user_id).toBe('user-ops');
    expect(store.executive_risk_case_ownership_history).toHaveLength(1);
    expect(mockNotifications.notifyUser).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-ops' }));
  });

  it('creates universal action and links to risk case', async () => {
    const { service, store, mockActions } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-act',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      executive_priority: 'Critical'
    });

    const act = await service.createAction(user, 'case-act', {
      title: 'Inspect PSV on Tank T-104',
      description: 'Perform immediate pop-test verification',
      ownerId: 'user-ops',
      dueDate: '2026-11-01T00:00:00.000Z',
      requiredForClosure: true
    });

    expect(mockActions.create).toHaveBeenCalledWith(
      'company-psm-1',
      user.id,
      expect.objectContaining({ priority: 'SAFETY_CRITICAL', evidenceRequired: true })
    );
    expect(store.executive_risk_case_action_links).toHaveLength(1);
  });

  it('refuses to close executive risk case if source is not resolved or verification pending', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-unresolved',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      source_resolved_at: null,
      pending_verification_count: 0
    });

    await expect(service.closeCase(user, 'case-unresolved', { reason: 'Done' }))
      .rejects.toThrow('The executive case cannot close until the underlying source record is resolved.');

    store.executive_risk_cases.push({
      id: 'case-pending-verif',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      source_resolved_at: '2026-10-01T00:00:00.000Z',
      pending_verification_count: 1
    });

    await expect(service.closeCase(user, 'case-pending-verif', { reason: 'Done' }))
      .rejects.toThrow('The executive case cannot close while verification is pending.');
  });

  it('closes executive risk case when source is resolved and verification count is 0', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-close-ok',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      source_resolved_at: '2026-10-01T00:00:00.000Z',
      pending_verification_count: 0,
      case_status: 'Awaiting Verification'
    });

    const closed = await service.closeCase(user, 'case-close-ok', { reason: 'Field valve repair verified by MI' });
    expect(closed.case_status).toBe('Closed');
    expect(closed.closed_by).toBe(user.id);
  });

  it('manages escalation workflow: create, reassign, advance level, cancel', async () => {
    const { service, store } = createMocks();
    store.executive_risk_cases.push({
      id: 'case-for-esc',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      executive_priority: 'Critical'
    });

    // 1. Create
    const esc = await service.createEscalation(user, {
      riskCaseId: 'case-for-esc',
      recipientUserId: 'user-ops',
      level: 1,
      reason: 'Safety critical barrier is impaired > 24 hours'
    });
    expect(esc.escalation_code).toMatch(/^EES-2026-/);
    expect(esc.escalation_level).toBe(1);

    // 2. Reassign
    const reassigned = await service.reassignEscalation(user, esc.id, { recipientUserId: 'user-admin' });
    expect(reassigned.escalated_to_user_id).toBe('user-admin');

    // 3. Advance Level
    const advanced = await service.advanceEscalationLevel(user, esc.id, { reason: 'No response after 48h SLA' });
    expect(advanced.escalation_level).toBe(2);

    // 4. Cancel
    const cancelled = await service.cancelEscalation(user, esc.id, { reason: 'False alarm verified by operations' });
    expect(cancelled.escalation_status).toBe('Cancelled');
  });

  it('manages escalation rules lifecycle: save, approve, and archive', async () => {
    const { service, store } = createMocks();

    const rule = await service.saveRule(user, {
      siteId: 'site-alpha',
      ruleName: 'Auto-Escalate Impaired SIS',
      triggerType: 'Critical Safety Barrier Impaired',
      priorityLevel: 'Critical',
      escalationLevel: 3,
      recipientUserId: 'user-ops'
    });
    expect(rule.rule_code).toMatch(/^EER-/);
    expect(rule.active).toBe(true);

    const approved = await service.approveRule(user, rule.id);
    expect(approved.approved_by).toBe(user.id);

    const archived = await service.archiveRule(user, rule.id, { reason: 'Deprecated rule' });
    expect(archived.active).toBe(false);
    expect(archived.archive_reason).toBe('Deprecated rule');
  });
});
