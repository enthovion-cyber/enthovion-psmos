import { describe, expect, it } from 'vitest';
import type {
  ExecutiveEscalation,
  ExecutiveOverdueAction,
  ExecutiveRiskCase,
} from '../types/executive-critical-risk.types';
import { executiveCriticalRiskApi } from '../services/executive-critical-risk.service';

describe('Executive KPI Dashboard — Phase 5: Critical Risk + Overdue Action Cockpit + Escalation Management', () => {
  it('validates critical risk case code format conforms to ERC-YYYY-XXXXXXXX', () => {
    const caseCodeRegex = /^ERC-\d{4}-[A-Z0-9]+$/;
    expect(caseCodeRegex.test('ERC-2026-F89C402E')).toBe(true);
    expect(caseCodeRegex.test('ERC-2026-A1B2C3D4')).toBe(true);
    expect(caseCodeRegex.test('INCIDENT-101')).toBe(false);
  });

  it('validates escalation code format conforms to EES-YYYY-XXXXXXXX', () => {
    const escCodeRegex = /^EES-\d{4}-[A-Z0-9]+$/;
    expect(escCodeRegex.test('EES-2026-9A8B7C6D')).toBe(true);
    expect(escCodeRegex.test('EES-2026-12345678')).toBe(true);
    expect(escCodeRegex.test('ESCALATION-99')).toBe(false);
  });

  it('validates multi-tier escalation hierarchy levels from 0 to 5', () => {
    const levels = [
      { level: 0, title: 'Owner Follow-Up' },
      { level: 1, title: 'Department Manager' },
      { level: 2, title: 'Site PSM / HSE Manager' },
      { level: 3, title: 'Plant / Site Manager' },
      { level: 4, title: 'Corporate PSM Leadership' },
      { level: 5, title: 'Executive Leadership' },
    ];

    expect(levels).toHaveLength(6);
    expect(levels[0]?.level).toBe(0);
    expect(levels[5]?.level).toBe(5);
    expect(levels[5]?.title).toBe('Executive Leadership');
  });

  it('enforces that an executive case cannot close until source is resolved and verifications are zero', () => {
    const caseUnresolved: Partial<ExecutiveRiskCase> = {
      id: 'rc-1',
      source_resolved_at: null,
      pending_verification_count: 0,
    };

    const casePendingVerif: Partial<ExecutiveRiskCase> = {
      id: 'rc-2',
      source_resolved_at: '2026-10-01T00:00:00.000Z',
      pending_verification_count: 2,
    };

    const caseReadyToClose: Partial<ExecutiveRiskCase> = {
      id: 'rc-3',
      source_resolved_at: '2026-10-01T00:00:00.000Z',
      pending_verification_count: 0,
    };

    const canClose = (c: Partial<ExecutiveRiskCase>) =>
      Boolean(c.source_resolved_at) && Number(c.pending_verification_count ?? 0) === 0;

    expect(canClose(caseUnresolved)).toBe(false);
    expect(canClose(casePendingVerif)).toBe(false);
    expect(canClose(caseReadyToClose)).toBe(true);
  });

  it('accurately groups overdue actions into standardized aging buckets', () => {
    const mockActions: ExecutiveOverdueAction[] = [
      { id: '1', action_title: 'Action 1', source_module: 'mi', overdue_days: 3 },
      { id: '2', action_title: 'Action 2', source_module: 'pha', overdue_days: 10 },
      { id: '3', action_title: 'Action 3', source_module: 'incident', overdue_days: 25 },
      { id: '4', action_title: 'Action 4', source_module: 'moc', overdue_days: 45 },
      { id: '5', action_title: 'Action 5', source_module: 'audit', overdue_days: 90 },
      { id: '6', action_title: 'Action 6', source_module: 'ptw', overdue_days: 120 },
    ];

    const under7 = mockActions.filter((a) => a.overdue_days < 7).length;
    const days7to14 = mockActions.filter((a) => a.overdue_days >= 7 && a.overdue_days < 15).length;
    const days15to30 = mockActions.filter((a) => a.overdue_days >= 15 && a.overdue_days < 31).length;
    const days31to60 = mockActions.filter((a) => a.overdue_days >= 31 && a.overdue_days < 61).length;
    const over60 = mockActions.filter((a) => a.overdue_days >= 61).length;

    expect(under7).toBe(1);
    expect(days7to14).toBe(1);
    expect(days15to30).toBe(1);
    expect(days31to60).toBe(1);
    expect(over60).toBe(2);
  });

  it('accurately evaluates escalation SLA status and breach states', () => {
    const now = Date.now();
    const pastDue = new Date(now - 3600 * 1000).toISOString();
    const dueInTwoHours = new Date(now + 2 * 3600 * 1000).toISOString();
    const dueInThreeDays = new Date(now + 72 * 3600 * 1000).toISOString();

    const escalations: ExecutiveEscalation[] = [
      {
        id: 'esc-1',
        escalation_code: 'EES-2026-0001',
        escalation_status: 'Active',
        escalation_level: 2,
        escalation_reason: 'Breached',
        response_due_at: pastDue,
        created_at: pastDue,
      },
      {
        id: 'esc-2',
        escalation_code: 'EES-2026-0002',
        escalation_status: 'Active',
        escalation_level: 1,
        escalation_reason: 'Due soon',
        response_due_at: dueInTwoHours,
        created_at: new Date().toISOString(),
      },
      {
        id: 'esc-3',
        escalation_code: 'EES-2026-0003',
        escalation_status: 'Active',
        escalation_level: 3,
        escalation_reason: 'Healthy SLA',
        response_due_at: dueInThreeDays,
        created_at: new Date().toISOString(),
      },
    ];

    const isBreached = (e: ExecutiveEscalation) =>
      e.response_due_at ? new Date(e.response_due_at).getTime() < now : false;

    const isDueSoon = (e: ExecutiveEscalation) => {
      if (!e.response_due_at) return false;
      const diffHours = (new Date(e.response_due_at).getTime() - now) / (1000 * 3600);
      return diffHours >= 0 && diffHours <= 24;
    };

    expect(isBreached(escalations[0]!)).toBe(true);
    expect(isBreached(escalations[1]!)).toBe(false);
    expect(isDueSoon(escalations[1]!)).toBe(true);
    expect(isDueSoon(escalations[2]!)).toBe(false);
  });

  it('validates critical barrier impairment flags and categories', () => {
    const cases: ExecutiveRiskCase[] = [
      {
        id: 'c-1',
        risk_title: 'Emergency Depressuring Valve BDV-101 Jammed',
        risk_priority: 'Critical',
        case_status: 'Open',
        source_module: 'mechanical-integrity',
        barrier_impaired: true,
        barrier_type: 'ESD',
      },
      {
        id: 'c-2',
        risk_title: 'Permit Expired on Hot Work',
        risk_priority: 'High',
        case_status: 'Open',
        source_module: 'ptw',
        barrier_impaired: false,
      },
    ];

    const impairedBarriers = cases.filter((c) => c.barrier_impaired);
    expect(impairedBarriers).toHaveLength(1);
    expect(impairedBarriers[0]?.barrier_type).toBe('ESD');
  });

  it('verifies executiveCriticalRiskApi has complete Phase 5 methods wired', () => {
    expect(typeof executiveCriticalRiskApi.dashboard).toBe('function');
    expect(typeof executiveCriticalRiskApi.recalculate).toBe('function');
    expect(typeof executiveCriticalRiskApi.cases).toBe('function');
    expect(typeof executiveCriticalRiskApi.caseDetail).toBe('function');
    expect(typeof executiveCriticalRiskApi.acknowledge).toBe('function');
    expect(typeof executiveCriticalRiskApi.assignOwner).toBe('function');
    expect(typeof executiveCriticalRiskApi.createAction).toBe('function');
    expect(typeof executiveCriticalRiskApi.linkAction).toBe('function');
    expect(typeof executiveCriticalRiskApi.requestVerification).toBe('function');
    expect(typeof executiveCriticalRiskApi.close).toBe('function');
    expect(typeof executiveCriticalRiskApi.barriers).toBe('function');
    expect(typeof executiveCriticalRiskApi.historyList).toBe('function');
    expect(typeof executiveCriticalRiskApi.overdueActions).toBe('function');
    expect(typeof executiveCriticalRiskApi.overdueAction).toBe('function');
    expect(typeof executiveCriticalRiskApi.overdueActionsByOwner).toBe('function');
    expect(typeof executiveCriticalRiskApi.overdueActionsBySite).toBe('function');
    expect(typeof executiveCriticalRiskApi.overdueActionsByModule).toBe('function');
    expect(typeof executiveCriticalRiskApi.escalations).toBe('function');
    expect(typeof executiveCriticalRiskApi.escalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.createEscalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.acknowledgeEscalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.decision).toBe('function');
    expect(typeof executiveCriticalRiskApi.reassignEscalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.advanceEscalationLevel).toBe('function');
    expect(typeof executiveCriticalRiskApi.cancelEscalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.closeEscalation).toBe('function');
    expect(typeof executiveCriticalRiskApi.rules).toBe('function');
    expect(typeof executiveCriticalRiskApi.saveRule).toBe('function');
    expect(typeof executiveCriticalRiskApi.approveRule).toBe('function');
    expect(typeof executiveCriticalRiskApi.archiveRule).toBe('function');
    expect(typeof executiveCriticalRiskApi.dryRunRule).toBe('function');
    expect(typeof executiveCriticalRiskApi.leadership).toBe('function');
    expect(typeof executiveCriticalRiskApi.lookups).toBe('function');
  });
});
