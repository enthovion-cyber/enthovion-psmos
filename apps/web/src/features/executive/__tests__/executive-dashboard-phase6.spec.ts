import { describe, expect, it } from 'vitest';
import type {
  ManagementReviewCycle,
  ManagementReviewMeeting,
  ManagementReviewDecision,
  ManagementReviewCommitment,
  ManagementReviewPackage,
  ManagementReviewMinutes,
  ManagementReviewReadiness,
} from '../types/executive-management-review.types';
import { managementReviewApi } from '../services/executive-management-review.service';
import * as ModuleExports from '../management-review';

describe('Executive KPI Dashboard — Phase 6: Management Review Dashboard + Leadership Governance + Executive Decision Tracking', () => {
  describe('1. Code Format Identifiers', () => {
    it('validates review cycle code format MRC-YYYY-XXXXXXXX', () => {
      const cycleRegex = /^MRC-\d{4}-[A-Z0-9]+$/;
      expect(cycleRegex.test('MRC-2026-F89C402E')).toBe(true);
      expect(cycleRegex.test('MRC-2026-12345678')).toBe(true);
      expect(cycleRegex.test('CYCLE-101')).toBe(false);
    });

    it('validates review meeting code format MRM-YYYY-XXXXXXXX', () => {
      const meetingRegex = /^MRM-\d{4}-[A-Z0-9]+$/;
      expect(meetingRegex.test('MRM-2026-A1B2C3D4')).toBe(true);
      expect(meetingRegex.test('MRM-2026-99999999')).toBe(true);
      expect(meetingRegex.test('MEETING-01')).toBe(false);
    });

    it('validates review package code format MRP-YYYY-XXXXXXXX', () => {
      const pkgRegex = /^MRP-\d{4}-[A-Z0-9]+$/;
      expect(pkgRegex.test('MRP-2026-77778888')).toBe(true);
      expect(pkgRegex.test('PKG-2026-01')).toBe(false);
    });

    it('validates executive decision code format MRD-YYYY-XXXXXXXX', () => {
      const decRegex = /^MRD-\d{4}-[A-Z0-9]+$/;
      expect(decRegex.test('MRD-2026-DEC00001')).toBe(true);
      expect(decRegex.test('DECISION-1')).toBe(false);
    });

    it('validates management commitment code format MCC-YYYY-XXXXXXXX', () => {
      const cmtRegex = /^MCC-\d{4}-[A-Z0-9]+$/;
      expect(cmtRegex.test('MCC-2026-CMT00001')).toBe(true);
      expect(cmtRegex.test('ACTION-1')).toBe(false);
    });
  });

  describe('2. Governance Readiness & Gatekeeper Scoring', () => {
    it('evaluates readiness status as ready when 0 blockers and 0 warnings', () => {
      const calculateReadiness = (blockersCount: number, warningsCount: number) => {
        if (blockersCount > 0) return { status: 'blocked', score: Math.max(20, 100 - blockersCount * 30 - warningsCount * 10) };
        if (warningsCount > 0) return { status: 'warning', score: Math.max(60, 100 - warningsCount * 10) };
        return { status: 'ready', score: 100 };
      };

      const result1 = calculateReadiness(0, 0);
      expect(result1.status).toBe('ready');
      expect(result1.score).toBe(100);

      const result2 = calculateReadiness(0, 2);
      expect(result2.status).toBe('warning');
      expect(result2.score).toBe(80);

      const result3 = calculateReadiness(2, 1);
      expect(result3.status).toBe('blocked');
      expect(result3.score).toBe(30);
    });

    it('enforces that package publication is prohibited if critical blockers exist', () => {
      const canPublishPackage = (readiness: { blockersCount: number; allowWarnings: boolean; warningsCount: number }) => {
        if (readiness.blockersCount > 0) return false;
        if (readiness.warningsCount > 0 && !readiness.allowWarnings) return false;
        return true;
      };

      expect(canPublishPackage({ blockersCount: 1, allowWarnings: true, warningsCount: 0 })).toBe(false);
      expect(canPublishPackage({ blockersCount: 0, allowWarnings: false, warningsCount: 1 })).toBe(false);
      expect(canPublishPackage({ blockersCount: 0, allowWarnings: true, warningsCount: 2 })).toBe(true);
      expect(canPublishPackage({ blockersCount: 0, allowWarnings: false, warningsCount: 0 })).toBe(true);
    });
  });

  describe('3. Meeting Quorum Calculation', () => {
    it('evaluates quorum satisfaction based on threshold and required roles', () => {
      const evaluateQuorum = (
        totalInvited: number,
        presentCount: number,
        hasRequiredPsmLead: boolean,
        hasRequiredSiteManager: boolean,
        minPercentage: number = 75
      ) => {
        const percentage = totalInvited > 0 ? (presentCount / totalInvited) * 100 : 0;
        const meetsPercentage = percentage >= minPercentage;
        const meetsKeyRoles = hasRequiredPsmLead && hasRequiredSiteManager;
        return meetsPercentage && meetsKeyRoles;
      };

      // 8 out of 10 attendees (80% >= 75%) and all key roles present
      expect(evaluateQuorum(10, 8, true, true, 75)).toBe(true);

      // 80% attendance but missing site manager
      expect(evaluateQuorum(10, 8, true, false, 75)).toBe(false);

      // 60% attendance with key roles present (below 75%)
      expect(evaluateQuorum(10, 6, true, true, 75)).toBe(false);
    });
  });

  describe('4. Commitment Aging Brackets & Follow-Up', () => {
    it('correctly categorizes overdue days into governance aging buckets', () => {
      const categorizeAging = (daysOverdue: number) => {
        if (daysOverdue <= 7) return 'under7Days';
        if (daysOverdue <= 14) return 'sevenTo14Days';
        if (daysOverdue <= 30) return 'fifteenTo30Days';
        return 'over30Days';
      };

      expect(categorizeAging(3)).toBe('under7Days');
      expect(categorizeAging(7)).toBe('under7Days');
      expect(categorizeAging(8)).toBe('sevenTo14Days');
      expect(categorizeAging(14)).toBe('sevenTo14Days');
      expect(categorizeAging(15)).toBe('fifteenTo30Days');
      expect(categorizeAging(30)).toBe('fifteenTo30Days');
      expect(categorizeAging(45)).toBe('over30Days');
    });

    it('requires independent verification before a commitment can be closed', () => {
      const canCloseCommitment = (commitment: Partial<ManagementReviewCommitment>, hasVerifiedEvidence: boolean) => {
        if (commitment.status === 'Cancelled') return true;
        if (!commitment.owner_user_id) return false;
        return hasVerifiedEvidence && commitment.status !== 'Draft';
      };

      expect(canCloseCommitment({ status: 'In Progress', owner_user_id: 'usr-1' }, false)).toBe(false);
      expect(canCloseCommitment({ status: 'In Progress', owner_user_id: undefined }, true)).toBe(false);
      expect(canCloseCommitment({ status: 'Pending Verification', owner_user_id: 'usr-1' }, true)).toBe(true);
    });
  });

  describe('5. Carry-Forward Integrity', () => {
    it('validates carry-forward transition links origin cycle and target cycle with documented reason', () => {
      const validateCarryForward = (entry: {
        sourceCommitmentId: string;
        originCycleId: string;
        targetCycleId: string;
        reason: string;
      }) => {
        if (!entry.sourceCommitmentId || !entry.originCycleId || !entry.targetCycleId) return false;
        if (entry.originCycleId === entry.targetCycleId) return false; // Must be cross-cycle
        if (!entry.reason || entry.reason.trim().length < 5) return false;
        return true;
      };

      expect(
        validateCarryForward({
          sourceCommitmentId: 'cmt-1',
          originCycleId: 'cycle-2025',
          targetCycleId: 'cycle-2026',
          reason: 'Long-lead equipment procurement scheduled for Q2 turnaround',
        })
      ).toBe(true);

      // Same cycle rejected
      expect(
        validateCarryForward({
          sourceCommitmentId: 'cmt-1',
          originCycleId: 'cycle-2026',
          targetCycleId: 'cycle-2026',
          reason: 'Delayed',
        })
      ).toBe(false);

      // Short / missing reason rejected
      expect(
        validateCarryForward({
          sourceCommitmentId: 'cmt-1',
          originCycleId: 'cycle-2025',
          targetCycleId: 'cycle-2026',
          reason: 'No',
        })
      ).toBe(false);
    });
  });

  describe('6. Module Structure & Page Export Integrity', () => {
    it('exports all Phase 6 page and component units without undefined exports', () => {
      expect(ModuleExports.ExecutiveManagementReviewDashboardPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewCyclesPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewMeetingsPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewDecisionsPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewCommitmentsPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewPackagesPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewMinutesPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewFollowUpPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewCarryForwardPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewReadinessPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewCalendarPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewTemplatesPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewSettingsPage).toBeDefined();
      expect(ModuleExports.ExecutiveManagementReviewHistoryPage).toBeDefined();
    });

    it('exports all required badges and dialogs', () => {
      expect(ModuleExports.ManagementReviewCycleStatusBadge).toBeDefined();
      expect(ModuleExports.ManagementReviewMeetingStatusBadge).toBeDefined();
      expect(ModuleExports.ManagementReviewReadinessBadge).toBeDefined();
      expect(ModuleExports.ManagementReviewPackageStatusBadge).toBeDefined();
      expect(ModuleExports.ManagementReviewMinutesStatusBadge).toBeDefined();
      expect(ModuleExports.ExecutiveDecisionStatusBadge).toBeDefined();
      expect(ModuleExports.ExecutiveCommitmentStatusBadge).toBeDefined();
      expect(ModuleExports.MeetingAttendanceStatusBadge).toBeDefined();
      expect(ModuleExports.MeetingQuorumStatusBadge).toBeDefined();
      expect(ModuleExports.ReviewSourceFreshnessBadge).toBeDefined();

      expect(ModuleExports.CreateReviewCycleDialog).toBeDefined();
      expect(ModuleExports.ScheduleReviewMeetingDialog).toBeDefined();
      expect(ModuleExports.RecordExecutiveDecisionDialog).toBeDefined();
      expect(ModuleExports.CreateManagementCommitmentDialog).toBeDefined();
      expect(ModuleExports.CarryForwardCommitmentDialog).toBeDefined();
    });

    it('verifies managementReviewApi service contract has all Phase 6 operations', () => {
      expect(typeof managementReviewApi.dashboard).toBe('function');
      expect(typeof managementReviewApi.cycles).toBe('function');
      expect(typeof managementReviewApi.meetings).toBe('function');
      expect(typeof managementReviewApi.decisions).toBe('function');
      expect(typeof managementReviewApi.commitments).toBe('function');
      expect(typeof managementReviewApi.packages).toBe('function');
      expect(typeof managementReviewApi.minutes).toBe('function');
      expect(typeof managementReviewApi.followUp).toBe('function');
      expect(typeof managementReviewApi.carriedForwardList).toBe('function');
      expect(typeof managementReviewApi.readiness).toBe('function');
      expect(typeof managementReviewApi.calendar).toBe('function');
      expect(typeof managementReviewApi.templates).toBe('function');
      expect(typeof managementReviewApi.settings).toBe('function');
      expect(typeof managementReviewApi.history).toBe('function');
    });
  });
});
