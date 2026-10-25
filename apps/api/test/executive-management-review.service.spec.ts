import { describe, expect, it, vi, beforeEach } from 'vitest';
// @ts-expect-error Vitest needs the extension to avoid a stale generated .js sibling.
import { ExecutiveManagementReviewService } from '../src/executive/executive-management-review.service.ts';

const user = {
  id: 'user-exec-1',
  tenantId: 'company-psm-1',
  companyIds: ['company-psm-1'],
  selectedSiteId: 'site-alpha',
  siteIds: ['site-alpha'],
  corporateView: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
  permissions: [
    'executive.management_review.view',
    'executive.management_review.dashboard.view',
    'executive.management_review.readiness.view',
    'executive.management_review.settings.view',
    'executive.management_review.settings.edit',
    'executive.management_review.cycle.view',
    'executive.management_review.cycle.create',
    'executive.management_review.cycle.edit',
    'executive.management_review.cycle.activate',
    'executive.management_review.cycle.complete',
    'executive.management_review.cycle.reopen',
    'executive.management_review.cycle.archive',
    'executive.management_review.meeting.view',
    'executive.management_review.meeting.create',
    'executive.management_review.meeting.edit',
    'executive.management_review.meeting.schedule',
    'executive.management_review.meeting.reschedule',
    'executive.management_review.meeting.cancel',
    'executive.management_review.meeting.start',
    'executive.management_review.meeting.record_attendance',
    'executive.management_review.meeting.record_discussion',
    'executive.management_review.meeting.adjourn',
    'executive.management_review.meeting.complete',
    'executive.management_review.agenda.view',
    'executive.management_review.agenda.create',
    'executive.management_review.agenda.edit',
    'executive.management_review.agenda.reorder',
    'executive.management_review.agenda.defer',
    'executive.management_review.agenda.carry_forward',
    'executive.management_review.agenda.template.manage',
    'executive.management_review.package.view',
    'executive.management_review.package.create',
    'executive.management_review.package.generate',
    'executive.management_review.package.publish',
    'executive.management_review.package.download',
    'executive.management_review.package.regenerate',
    'executive.management_review.package.access_log.view',
    'executive.management_review.package.restricted.view',
    'executive.management_review.minutes.view',
    'executive.management_review.minutes.create',
    'executive.management_review.minutes.edit',
    'executive.management_review.minutes.submit',
    'executive.management_review.minutes.approve',
    'executive.management_review.minutes.lock',
    'executive.management_review.minutes.version.view',
    'executive.management_review.decision.view',
    'executive.management_review.decision.create',
    'executive.management_review.decision.edit',
    'executive.management_review.decision.submit',
    'executive.management_review.decision.approve',
    'executive.management_review.decision.supersede',
    'executive.management_review.decision.verify',
    'executive.management_review.decision.history.view',
    'executive.management_review.commitment.view',
    'executive.management_review.commitment.create',
    'executive.management_review.commitment.assign',
    'executive.management_review.commitment.followup',
    'executive.management_review.commitment.escalate',
    'executive.management_review.commitment.verify',
    'executive.management_review.commitment.close',
    'executive.management_review.commitment.carry_forward',
    'executive.management_review.history.view',
    'executive.management_review.audit.view',
    'executive.management_review.restricted_source.view'
  ]
};

describe('ExecutiveManagementReviewService (Phase 6: Leadership Governance & Decision Tracking)', () => {
  let service: ExecutiveManagementReviewService;
  let db: any;
  let audit: any;
  let scopeService: any;
  let actions: any;
  let notifications: any;
  let workflows: any;

  beforeEach(() => {
    db = {
      from: vi.fn(),
      single: vi.fn().mockImplementation(() => Promise.resolve({ id: 'mock-id' })),
      many: vi.fn().mockResolvedValue([]),
    };
    audit = {
      write: vi.fn().mockResolvedValue(true),
    };
    scopeService = {
      scope: vi.fn().mockReturnValue({ companyId: 'company-psm-1', siteId: 'site-alpha' }),
    };
    actions = {
      create: vi.fn().mockResolvedValue({ id: 'action-uuid-101', title: 'Remediation Action' }),
    };
    notifications = {
      send: vi.fn().mockResolvedValue(true),
    };
    workflows = {
      startWorkflow: vi.fn().mockResolvedValue({ id: 'wf-instance-1' }),
    };

    service = new ExecutiveManagementReviewService(
      db,
      audit,
      scopeService,
      actions,
      notifications,
      workflows
    );
  });

  it('provides comprehensive lookups for all Phase 6 governance models', () => {
    const lookups = service.lookups();
    expect(lookups['management-review-types']).toBeDefined();
    expect(lookups['management-review-types']).toContain('Corporate Management Review');
    expect(lookups['management-review-cycle-statuses']).toContain('Active');
    expect(lookups['management-review-meeting-statuses']).toContain('Scheduled');
    expect(lookups['management-review-agenda-categories']).toContain('Critical Risk Review');
    expect(lookups['management-review-decision-types']).toContain('Direct Corrective Action');
    expect(lookups['management-review-commitment-statuses']).toContain('Pending Verification');

    const specific = service.lookups('management-review-decision-types');
    expect(Array.isArray(specific)).toBe(true);
    expect(specific).toContain('Direct Corrective Action');
  });

  it('rejects access when user lacks required permission', async () => {
    const unauthorizedUser = { ...user, permissions: [] };
    await expect(service.dashboard(unauthorizedUser as any)).rejects.toThrow(
      'Missing required permission: executive.management_review.dashboard.view'
    );
  });

  it('creates and transitions a review cycle with history audit', async () => {
    const mockCycle = {
      id: 'cycle-uuid-1',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      cycle_code: 'MR-2026-Q4-01',
      cycle_title: 'Q4 2026 PSM Management Review',
      cycle_type: 'Company Management Review',
      governance_level: 'Executive',
      reporting_period_start: '2026-10-01T00:00:00.000Z',
      reporting_period_end: '2026-12-31T23:59:59.000Z',
      cycle_status: 'Draft',
    };

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    };

    db.from.mockReturnValue(mockQueryBuilder);
    db.single.mockResolvedValueOnce(mockCycle);

    const created = await service.createCycle(user as any, {
      title: 'Q4 2026 PSM Management Review',
      cycleType: 'Company Management Review',
      governanceLevel: 'Executive',
      reportingStart: '2026-10-01',
      reportingEnd: '2026-12-31',
      ownerId: 'user-exec-1',
    });

    expect(created.cycle_title).toBe('Q4 2026 PSM Management Review');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CYCLE_CREATED',
        entityType: 'ExecutiveManagementReview',
      })
    );
  });

  it('creates a Universal Action when creating commitment action', async () => {
    const mockCommitment = {
      id: 'cmt-100',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      commitment_title: 'Install PSV Secondary Relief',
      commitment_description: 'Overpressure relief modification required by leadership',
      effective_due_at: '2026-11-15T00:00:00.000Z',
      owner_user_id: 'engineer-1',
      priority: 'CRITICAL',
      verification_required: true,
      universal_action_id: null,
    };

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    };

    db.from.mockReturnValue(mockQueryBuilder);
    db.single
      .mockResolvedValueOnce(mockCommitment) // for one()
      .mockResolvedValueOnce({ ...mockCommitment, universal_action_id: 'action-uuid-101' }); // for update()

    const result = await service.createCommitmentAction(user as any, 'cmt-100');

    expect(actions.create).toHaveBeenCalledWith(
      'company-psm-1',
      'user-exec-1',
      expect.objectContaining({
        title: 'Install PSV Secondary Relief',
        sourceModule: 'EXECUTIVE_MANAGEMENT_REVIEW',
        sourceRecordId: 'cmt-100',
        priority: 'SAFETY_CRITICAL',
      })
    );
    expect(result.action.id).toBe('action-uuid-101');
  });

  it('computes follow-up commitments with aging histogram', async () => {
    const now = Date.now();
    const mockCommitments = [
      {
        id: 'cmt-1',
        effective_due_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3d overdue -> under 7d
        commitment_status: 'In Progress',
      },
      {
        id: 'cmt-2',
        effective_due_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10d overdue -> 7-14d
        commitment_status: 'Assigned',
      },
      {
        id: 'cmt-3',
        effective_due_at: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45d overdue -> over 30d
        commitment_status: 'Pending Verification',
      },
      {
        id: 'cmt-4',
        effective_due_at: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(), // Future
        commitment_status: 'In Progress',
      },
    ];

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockCommitments, count: 4, error: null }),
    };
    db.from.mockReturnValue(mockQueryBuilder);

    const followUp = await service.followUp(user as any);

    expect(followUp.totalCommitments).toBe(4);
    expect(followUp.overdueCommitments).toBe(3);
    expect(followUp.pendingVerificationCount).toBe(1);
    expect(followUp.aging.under7Days).toBe(1);
    expect(followUp.aging.sevenTo14Days).toBe(1);
    expect(followUp.aging.over30Days).toBe(1);
  });

  it('records carry-forward item and creates history trail', async () => {
    const mockCommitment = {
      id: 'cmt-carry',
      company_id: 'company-psm-1',
      site_id: 'site-alpha',
      review_cycle_id: 'cycle-1',
      meeting_id: 'meeting-1',
      decision_id: 'decision-1',
    };

    const mockCarryForward = {
      id: 'carry-uuid-1',
      company_id: 'company-psm-1',
      source_commitment_id: 'cmt-carry',
      carry_forward_reason: 'Awaiting long-lead actuator delivery',
    };

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
    db.from.mockReturnValue(mockQueryBuilder);
    db.single
      .mockResolvedValueOnce(mockCommitment)
      .mockResolvedValueOnce(mockCarryForward);

    const carryResult = await service.carryForward(user as any, 'cmt-carry', {
      reason: 'Awaiting long-lead actuator delivery',
    });

    expect(carryResult.carry_forward_reason).toBe('Awaiting long-lead actuator delivery');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'COMMITMENT_CARRIED_FORWARD',
      })
    );
  });
});
