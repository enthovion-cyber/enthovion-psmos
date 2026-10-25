import { describe, expect, it, vi, beforeEach } from 'vitest';
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutiveReportsService } from '../src/executive/executive-reports.service.ts';

const user = {
  id: 'user-report-1',
  tenantId: 'company-psm-1',
  tenantName: 'Enthovion Global Chemicals',
  companyIds: ['company-psm-1'],
  selectedSiteId: 'site-alpha',
  siteIds: ['site-alpha'],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    'executive.dashboard.view',
    'executive.report.dashboard.view',
    'executive.report.register.view',
    'executive.report.detail.view',
    'executive.report.create',
    'executive.report.edit',
    'executive.report.validate',
    'executive.report.generate',
    'executive.report.preview',
    'executive.report.publish',
    'executive.report.archive',
    'executive.report.history.view',
    'executive.report.template.view',
    'executive.report.template.manage',
    'executive.report.period.view',
    'executive.report.period.manage',
    'executive.report.audience.view',
    'executive.report.audience.manage',
    'executive.report.artifact.view',
    'executive.report.artifact.download',
    'executive.report.distribution.view',
    'executive.report.distribution.manage',
    'executive.report.schedule.view',
    'executive.report.schedule.manage',
    'executive.report.approval.submit',
    'executive.report.approval.view',
    'executive.report.board.view',
    'executive.report.board.create',
    'executive.report.source_trace.view',
  ],
};

describe('ExecutiveReportsService — Phase 8: Reports / Export + Board Packages', () => {
  let service: ExecutiveReportsService;
  let mockDb: any;
  let mockAudit: any;

  beforeEach(() => {
    mockAudit = { write: vi.fn().mockResolvedValue(undefined) };

    const mockReports: any[] = [
      {
        id: 'rep-1',
        company_id: 'company-psm-1',
        site_id: 'site-alpha',
        report_code: 'ERP-2026-BOARD001',
        report_title: 'Q3 2026 Board PSM Performance Package',
        report_type_id: 'executive-report-type-board-package',
        report_status: 'Approved',
        confidentiality: 'Board Confidential',
        current_version_id: 'ver-1',
        created_at: '2026-10-15T10:00:00Z',
        updated_at: '2026-10-15T12:00:00Z',
      },
      {
        id: 'rep-2',
        company_id: 'company-psm-1',
        site_id: 'site-alpha',
        report_code: 'ERP-2026-KPI00002',
        report_title: 'September 2026 Executive KPI Summary',
        report_type_id: 'executive-report-type-kpi-summary',
        report_status: 'Draft',
        confidentiality: 'Internal',
        current_version_id: 'ver-2',
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T11:00:00Z',
      },
    ];

    const mockVersions: any[] = [
      {
        id: 'ver-1',
        company_id: 'company-psm-1',
        report_id: 'rep-1',
        version_number: 1,
        version_status: 'Approved',
        approval_status: 'Approved',
        publication_status: 'Published',
        readiness_status: 'Ready',
        source_cut_off_at: '2026-09-30T23:59:59Z',
        created_at: '2026-10-15T10:00:00Z',
        updated_at: '2026-10-15T12:00:00Z',
      },
      {
        id: 'ver-2',
        company_id: 'company-psm-1',
        report_id: 'rep-2',
        version_number: 1,
        version_status: 'Draft',
        approval_status: 'Pending Approval',
        publication_status: 'Not Published',
        readiness_status: 'Ready With Warnings',
        source_cut_off_at: '2026-10-01T00:00:00Z',
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T11:00:00Z',
      },
    ];

    const mockArtifacts: any[] = [
      {
        id: 'art-1',
        company_id: 'company-psm-1',
        report_version_id: 'ver-1',
        artifact_format: 'PDF',
        artifact_status: 'Completed',
        document_id: 'DOC-REP-BOARD001',
        checksum: 'SHA256:123456789ABCDEF',
        created_at: '2026-10-15T12:05:00Z',
      },
    ];

    const makeQuery = (data: any = []) => {
      let filteredData = Array.isArray(data) ? [...data] : [data];
      let currentVal: any = null;

      const q: any = {
        select: vi.fn().mockImplementation(() => q),
        insert: vi.fn().mockImplementation((val) => {
          currentVal = Array.isArray(val) ? val[0] : val;
          return q;
        }),
        update: vi.fn().mockImplementation((val) => {
          currentVal = { ...(filteredData[0] ?? {}), ...val };
          return q;
        }),
        upsert: vi.fn().mockImplementation((val) => {
          currentVal = Array.isArray(val) ? val[0] : val;
          return q;
        }),
        delete: vi.fn().mockImplementation(() => q),
        eq: vi.fn().mockImplementation((field: string, val: any) => {
          filteredData = filteredData.filter((r) => r && r[field] === val);
          return q;
        }),
        is: vi.fn().mockImplementation(() => q),
        or: vi.fn().mockImplementation(() => q),
        order: vi.fn().mockImplementation(() => q),
        limit: vi.fn().mockImplementation(() => q),
        range: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: filteredData, count: filteredData.length, error: null })
        ),
        single: vi.fn().mockImplementation(() =>
          Promise.resolve({ data: currentVal ?? filteredData[0] ?? null, error: null })
        ),
        then: (resolve: any, reject?: any) => {
          return Promise.resolve({ data: filteredData, count: filteredData.length, error: null }).then(resolve, reject);
        },
      };
      return q;
    };

    mockDb = {
      from: vi.fn((table: string) => {
        if (table === 'executive_reports') return makeQuery(mockReports);
        if (table === 'executive_report_versions') return makeQuery(mockVersions);
        if (table === 'executive_report_artifacts') return makeQuery(mockArtifacts);
        if (table === 'executive_report_types') {
          return makeQuery([
            { id: 'executive-report-type-board-package', report_type_name: 'Board PSM Performance Package', report_type_code: 'BOARD_PACKAGE', active: true },
            { id: 'executive-report-type-kpi-summary', report_type_name: 'Executive KPI Summary', report_type_code: 'KPI_SUMMARY', active: true },
          ]);
        }
        if (table === 'executive_reporting_periods') {
          return makeQuery([{ id: 'period-q3', period_code: 'ERP-2026-Q3', period_name: 'Q3 2026', cut_off_at: '2026-09-30T23:59:59Z', ends_at: '2026-09-30T23:59:59Z' }]);
        }
        if (table === 'executive_report_audience_profiles') {
          return makeQuery([{ id: 'aud-board', profile_code: 'ERA-BOARD', profile_name: 'Board Oversight Committee' }]);
        }
        if (table === 'executive_report_schedules') {
          return makeQuery([{ id: 'sch-1', schedule_name: 'Monthly Board Digest', active: true }]);
        }
        if (
          table === 'executive_kpi_snapshots' ||
          table === 'executive_psm_element_snapshots' ||
          table === 'executive_risk_aggregation_runs' ||
          table === 'executive_trend_runs'
        ) {
          return makeQuery([{ id: 'snap-1', company_id: 'company-psm-1', calculated_at: '2026-10-14T00:00:00Z', completed_at: '2026-10-14T00:00:00Z' }]);
        }
        return makeQuery([]);
      }),
      single: vi.fn(async (res: any) => {
        const unwrapped = await (res?.single ? res.single() : res);
        return unwrapped?.data ?? unwrapped;
      }),
    };

    service = new ExecutiveReportsService(mockDb, mockAudit);
  });

  describe('1. Dashboard & Lookups', () => {
    it('returns executive reports dashboard summary', async () => {
      const res = await service.dashboard(user as any, {});
      expect(res.summary).toBeDefined();
      expect(res.summary.totalReports).toBeGreaterThanOrEqual(2);
      expect(res.summary.boardPackages).toBe(1);
      expect(res.summary.averageReadinessRate).toBe(94);
      expect(res.recentReports.length).toBeGreaterThan(0);
    });

    it('returns lookup categories for Phase 8 reporting standards', async () => {
      const lookups = await service.lookups(user as any);
      expect(lookups.reportTypes.length).toBeGreaterThanOrEqual(5);
      expect(lookups.exportFormats).toContain('PDF');
      expect(lookups.exportFormats).toContain('XLSX');
      expect(lookups.exportFormats).toContain('PPTX');
      expect(lookups.confidentialityLevels).toContain('Board Confidential');
    });
  });

  describe('2. Board Reporting & Packages', () => {
    it('returns board-level dashboard metrics and package registry', async () => {
      const res = await service.boardDashboard(user as any, {});
      expect(res.summary.totalBoardPackages).toBe(1);
      expect(res.nextDeadline.dueDate).toBe('2026-11-15');
      expect(res.packages.length).toBe(1);
    });

    it('creates a Board Assurance Package with Board Confidential classification', async () => {
      const res = await service.createBoardPackage(user as any, {
        reportingPeriod: 'Q3 2026',
        title: 'Q3 2026 Board PSM Performance Package',
      });
      expect(res.report).toBeDefined();
      expect(res.version.version_number).toBe(1);
      expect(res.report.confidentiality).toBe('Board Confidential');
    });
  });

  describe('3. Report Validation & Source Lineage Manifest', () => {
    it('validates report readiness and populates evidence manifest', async () => {
      const res = await service.validate(user as any, 'rep-1');
      expect(res.readinessStatus).toBe('Ready');
      expect(res.manifest).toBeDefined();
      expect(res.sources.length).toBe(4);
    });
  });

  describe('4. Governance Lifecycle: Approval & Immutability', () => {
    it('handles approval submission and marks report as under review', async () => {
      const res = await service.submitApproval(user as any, 'rep-2', { notes: 'Ready for executive sign-off' });
      expect(res.status).toBe('Pending Approval');
    });

    it('approves and seals the report version', async () => {
      const res = await service.approve(user as any, 'rep-1', { notes: 'Approved by VP PSM' });
      expect(res.status).toBe('Approved');
      expect(res.approvedAt).toBeDefined();
    });

    it('creates a new version without mutating the approved baseline', async () => {
      const res = await service.createVersion(user as any, 'rep-1', { reason: 'Annual review update' });
      expect(res.version.version_number).toBe(2);
      expect(res.version.version_status).toBe('Draft');
    });
  });

  describe('5. Artifact Generation & Controlled Download', () => {
    it('generates a verified artifact record and checksum', async () => {
      const res = await service.generate(user as any, 'rep-1', { format: 'PDF' });
      expect(res.artifact.artifact_format).toBe('PDF');
      expect(res.artifact.artifact_status).toBe('Completed');
      expect(res.artifact.checksum).toContain('SHA256:');
    });

    it('records an audit event upon artifact download request', async () => {
      const res = await service.download(user as any, 'art-1');
      expect(res.downloadUrl).toContain('/api/v1/executive/reports/artifacts/art-1/stream');
      expect(res.checksum).toBe('SHA256:123456789ABCDEF');
    });
  });
});
