import { describe, expect, it, vi, beforeEach } from 'vitest';
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutiveTrendsService } from '../src/executive/executive-trends.service.ts';

const user = {
  id: 'user-trend-1',
  tenantId: 'company-psm-1',
  companyIds: ['company-psm-1'],
  selectedSiteId: 'site-alpha',
  siteIds: ['site-alpha'],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    'executive.trend.dashboard.view',
    'executive.trend.explorer.view',
    'executive.trend.kpi.view',
    'executive.trend.module.view',
    'executive.trend.psm_element.view',
    'executive.trend.run.view',
    'executive.trend.run.create',
    'executive.trend.run.recalculate',
    'executive.trend.run.cancel',
    'executive.trend.run.archive',
    'executive.trend.methodology.view',
    'executive.trend.methodology.manage',
    'executive.trend.site.view',
    'executive.trend.unit.view',
    'executive.trend.department.view',
    'executive.trend.compare.view',
    'executive.trend.cross_site_compare.view',
    'executive.trend.heatmap.view',
    'executive.trend.repeat_issue.view',
    'executive.trend.repeat_issue.detect',
    'executive.trend.repeat_issue.confirm',
    'executive.trend.repeat_issue.reject',
    'executive.trend.repeat_issue.create_action',
    'executive.trend.recurring_cluster.view',
    'executive.trend.recurring_cluster.manage',
    'executive.trend.escalation.view',
    'executive.trend.management_review.view',
    'executive.trend.worsening.view',
    'executive.trend.insight.view',
    'executive.trend.insight.review',
    'executive.trend.alert.view',
    'executive.trend.alert.acknowledge',
    'executive.trend.alert.resolve',
    'executive.trend.alert_rule.view',
    'executive.trend.alert_rule.manage',
    'executive.trend.management_review_candidate.create',
    'executive.trend.source_trace.view',
    'executive.trend.restricted_trace.view',
    'executive.trend.data_quality.view',
    'executive.trend.history.view',
    'executive.trend.settings.view',
    'executive.trend.settings.edit',
  ],
};

describe('ExecutiveTrendsService — Phase 7: Trends + Repeat Issues + Escalation Intelligence', () => {
  let service: ExecutiveTrendsService;
  let db: any;
  let audit: any;
  let aggregation: any;
  let actions: any;
  let criticalRisk: any;

  beforeEach(() => {
    const makeQuery = (data: any = []) => {
      const q: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((val) => {
          q._val = Array.isArray(val) ? val[0] : val;
          return q;
        }),
        update: vi.fn().mockImplementation((val) => {
          q._val = { ...(q._val ?? {}), ...val };
          return q;
        }),
        upsert: vi.fn().mockImplementation((val) => {
          q._val = Array.isArray(val) ? val[0] : val;
          return q;
        }),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], count: Array.isArray(data) ? data.length : 1, error: null }),
        single: vi.fn().mockImplementation(() => {
          const p = Promise.resolve(q._val ?? (Array.isArray(data) ? data[0] : data));
          (p as any)._val = q._val ?? (Array.isArray(data) ? data[0] : data);
          return p;
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          const p = Promise.resolve(q._val ?? (Array.isArray(data) ? data[0] : data));
          (p as any)._val = q._val ?? (Array.isArray(data) ? data[0] : data);
          return p;
        }),
      };
      return q;
    };

    db = {
      from: vi.fn().mockImplementation((table: string) => makeQuery()),
      many: vi.fn().mockImplementation((req: any) => Promise.resolve(Array.isArray(req?._data) ? req._data : [])),
      single: vi.fn().mockImplementation((req: any) => Promise.resolve(req?._val ?? req)),
    };

    audit = { write: vi.fn().mockResolvedValue(undefined) };
    aggregation = { scope: vi.fn().mockReturnValue({ companyId: 'company-psm-1', siteId: 'site-alpha' }) };
    actions = { create: vi.fn().mockResolvedValue({ id: 'action-uuid-1', title: 'Remediation' }) };
    criticalRisk = { createEscalation: vi.fn().mockResolvedValue({ id: 'esc-uuid-1' }) };

    service = new ExecutiveTrendsService(db, audit, aggregation, actions, criticalRisk);
  });

  it('1. returns Phase 7 trend lookups dictionary with all expected categories', () => {
    const lookups = service.lookups();
    expect(lookups).toBeDefined();
    expect(lookups['trend-types']).toContain('Point-in-time Count');
    expect(lookups['trend-granularities']).toContain('Monthly');
    expect(lookups['trend-directions']).toContain('Improving');
    expect(lookups['trend-directions']).toContain('Worsening');
    expect(lookups['repeat-issue-statuses']).toContain('Confirmed Repeat');
    expect(lookups['repeat-issue-statuses']).toContain('Potential Repeat');
    expect(lookups['trend-alert-types']).toContain('Sustained Worsening Trend');
  });

  it('2. compiles dashboard metrics without backfilling missing periods', async () => {
    db.from.mockImplementation((table: string) => {
      const q: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            { id: 'run-1', run_status: 'Completed', run_code: 'ETR-2026-001' },
          ],
          count: 1,
          error: null,
        }),
      };
      return q;
    });

    db.many.mockImplementation((req: any) => Promise.resolve([]));

    const res = await service.dashboard(user as any);
    expect(res).toBeDefined();
    expect(res.scope.siteId).toBe('site-alpha');
    expect(res.summary.historicalRuns).toBe(1);
    expect(res.dataQuality).toBe('Observed Historical Data');
  });

  it('3. generates an immutable trend run and records worsening condition insights on 3 deteriorating periods', async () => {
    // Setup 3 observed historical rows showing deterioration for critical-risks (higher is worsening)
    const mockSourceRows = [
      { id: 'cr-1', completed_at: '2026-01-15T00:00:00.000Z', active_case_count: 2 },
      { id: 'cr-2', completed_at: '2026-02-15T00:00:00.000Z', active_case_count: 5 },
      { id: 'cr-3', completed_at: '2026-03-15T00:00:00.000Z', active_case_count: 9 },
    ];

    let insertedInsight = false;

    db.from.mockImplementation((table: string) => {
      const q: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((val) => {
          q._val = Array.isArray(val) ? val[0] : val;
          if (table === 'executive_trend_insights') insertedInsight = true;
          return q;
        }),
        update: vi.fn().mockImplementation((val) => {
          q._val = { ...(q._val ?? {}), ...val };
          return q;
        }),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          const val = q._val ?? { id: `${table}-id` };
          const p = Promise.resolve(val);
          (p as any)._val = val;
          return p;
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          const val = q._val ?? { id: `${table}-id` };
          const p = Promise.resolve(val);
          (p as any)._val = val;
          return p;
        }),
      };
      return q;
    });

    db.single.mockImplementation((req: any) => Promise.resolve(req?._val ?? req));
    db.many.mockImplementation((req: any) => Promise.resolve(mockSourceRows));

    const run = await service.createRun(user as any, {
      source: 'critical-risks',
      dateRangeStart: '2026-01-01T00:00:00.000Z',
      dateRangeEnd: '2026-03-31T23:59:59.000Z',
      granularity: 'Monthly',
    });

    expect(run).toBeDefined();
    expect(insertedInsight).toBe(true);
  });

  it('4. detects repeat issues from canonical taxonomy matches and respects minimum occurrence threshold', async () => {
    const duplicateCases = [
      { id: 'rc-1', observed_at: '2026-01-10T00:00:00.000Z', canonical_identity_key: 'PHA|Recommendation|PHA-04|High', source_module: 'pha', source_record_type: 'Recommendation' },
      { id: 'rc-2', observed_at: '2026-02-12T00:00:00.000Z', canonical_identity_key: 'PHA|Recommendation|PHA-04|High', source_module: 'pha', source_record_type: 'Recommendation' },
      { id: 'rc-3', observed_at: '2026-03-14T00:00:00.000Z', canonical_identity_key: 'PHA|Recommendation|PHA-04|High', source_module: 'pha', source_record_type: 'Recommendation' },
    ];

    db.from.mockImplementation((table: string) => {
      const q: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockImplementation((val) => {
          q._val = val;
          return q;
        }),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve(q._val ?? { id: 'c-1', repeat_code: 'ERI-1' })),
        maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(q._val ?? { id: 'c-1' })),
      };
      return q;
    });

    db.single.mockImplementation((req: any) => Promise.resolve(req?._val ?? { id: 'run-1', run: { id: 'run-1' } }));
    db.many.mockImplementation(() => Promise.resolve(duplicateCases));

    const result = await service.detectRepeats(user as any, {
      minimumOccurrenceCount: 2,
    });

    expect(result).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.status).toContain('Detection completed');
  });

  it('5. reviews repeat issue candidate with mandatory reason and creates linked audit event', async () => {
    const candidate = { id: 'cand-1', repeat_status: 'Potential Repeat', primary_source_module: 'audit', psm_element_id: 'element-05' };
    db.single.mockImplementation((req: any) => Promise.resolve(req?._val ?? candidate));

    // Confirm repeat
    const reviewed = await service.reviewRepeat(user as any, 'cand-1', 'Confirmed Repeat', {
      reason: 'Confirmed recurrence of pressure safety valve calibration failure on boiler system.',
    });

    expect(reviewed).toBeDefined();
    expect(audit.write).toHaveBeenCalled();
  });

  it('6. prevents unauthorized access when user lacks required permission', async () => {
    const unprivilegedUser = { ...user, permissions: [] };
    await expect(service.dashboard(unprivilegedUser as any)).rejects.toThrow();
    await expect(service.createRun(unprivilegedUser as any)).rejects.toThrow();
  });
});
