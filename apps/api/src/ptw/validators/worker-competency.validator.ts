import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

export interface WorkerCompetencyResult {
  workerId: string;
  workerName: string;
  roleOnPermit: string;
  isAuthorized: boolean;
  status: 'VALID' | 'EXPIRED' | 'MISSING' | 'EXPIRING_SOON' | 'NOT_REQUIRED';
  expiryDate: string | null;
  daysToExpiry: number | null;
  certTitle: string | null;
  blockerMessage: string | null;
}

export interface PermitCompetencyAudit {
  permitId: string;
  permitType?: string;
  cleared: boolean;
  isFullyCompliant: boolean;
  checkedAt: string;
  totalWorkers: number;
  authorizedCount: number;
  blockedCount: number;
  blockers: string[];
  violations: string[];
  evaluations: WorkerCompetencyResult[];
  workers: Array<{
    userId?: string;
    workerName: string;
    role: string;
    compliant: boolean;
    missingOrExpiredCerts: string[];
  }>;
}

@Injectable()
export class WorkerCompetencyValidator {
  private readonly logger = new Logger(WorkerCompetencyValidator.name);

  // PSM high-risk roles that require verified, unexpired competency certificates
  private readonly HIGH_RISK_ROLES: Record<string, string[]> = {
    'Permit Holder': ['Permit Holder', 'PTW Receiver', 'Safe Work Leader', 'General PSM'],
    'Permit Issuer': ['Permit Issuer', 'Area Authority', 'PTW Issuer'],
    'Area Authority': ['Area Authority', 'Plant Operator Lead'],
    'Performing Authority': ['Performing Authority', 'Job Supervisor'],
    'Gas Tester': ['Authorized Gas Tester', 'AGT Level 1', 'AGT Level 2', 'Atmospheric Monitoring'],
    'Fire Watch': ['Fire Watch', 'Hot Work Safety', 'Fire Sentry'],
    'Confined Space Entrant': ['Confined Space Entry', 'CSE Entrant', 'Breathing Apparatus'],
    'Confined Space Attendant': ['Confined Space Attendant', 'CSE Standby Person', 'Hole Watch'],
    'Isolation Authority': ['Electrical Isolation Authority', 'Mechanical Isolation Authority', 'LOTO Authority'],
    'Authorised Electrical Person': ['Authorised Electrical Person', 'AEP High Voltage', 'Electrical Safety']
  };

  constructor(private readonly repo: PermitRepository) {}

  /**
   * Evaluates all assigned workers on a permit against training certifications
   */
  async auditPermitWorkforce(tenantId: string, permit: Record<string, any>): Promise<PermitCompetencyAudit> {
    const workforce: any[] = permit.workforce ?? [];
    const evaluations: WorkerCompetencyResult[] = [];
    const blockers: string[] = [];

    if (!workforce.length) {
      return {
        permitId: permit.id,
        permitType: permit.permit_type,
        cleared: true,
        isFullyCompliant: true,
        checkedAt: new Date().toISOString(),
        totalWorkers: 0,
        authorizedCount: 0,
        blockedCount: 0,
        blockers: [],
        violations: [],
        evaluations: [],
        workers: []
      };
    }

    const todayStr = new Date().toISOString().split('T')[0] ?? '';

    // Query active authorizations from training_ptw_authorizations
    let authRows: any[] = [];
    try {
      authRows = await this.repo.db.many<any>(
        this.repo.db.from('training_ptw_authorizations')
          .select('id, worker_id, linked_user_id, ptw_role, authorization_status, effective_date, expiry_date, days_to_expiry')
          .eq('company_id', tenantId)
      );
    } catch {
      // Graceful fallback if table is partitioned or schema varies
      authRows = [];
    }

    // Query training_workers if needed to resolve worker_id
    let workerRows: any[] = [];
    try {
      workerRows = await this.repo.db.many<any>(
        this.repo.db.from('training_workers')
          .select('id, user_id, worker_name, company_id')
          .eq('company_id', tenantId)
      );
    } catch {
      workerRows = [];
    }

    for (const worker of workforce) {
      const role = worker.role_on_permit ?? worker.role ?? 'Worker';
      const workerName = worker.worker_name ?? worker.name ?? 'Unknown Worker';
      const userId = worker.user_id ?? null;

      // Check if this role requires high-risk competency certification
      const requiredCertTypes = this.resolveRequiredCertifications(role, permit.permit_type);

      if (!requiredCertTypes.length) {
        evaluations.push({
          workerId: worker.id,
          workerName,
          roleOnPermit: role,
          isAuthorized: true,
          status: 'NOT_REQUIRED',
          expiryDate: null,
          daysToExpiry: null,
          certTitle: 'Standard Worker (No specialized certification required)',
          blockerMessage: null
        });
        continue;
      }

      // Match in training_ptw_authorizations
      const matchedAuth = authRows.find((auth) => {
        const matchesUser = userId && auth.linked_user_id === userId;
        const matchesWorker = worker.training_worker_id && auth.worker_id === worker.training_worker_id;
        const linkedWorker = workerRows.find((w) => w.user_id === userId || w.worker_name?.toLowerCase() === workerName.toLowerCase());
        const matchesLinkedWorker = linkedWorker && auth.worker_id === linkedWorker.id;

        const roleMatch = this.roleMatchesAuth(role, auth.ptw_role, requiredCertTypes);
        return (matchesUser || matchesWorker || matchesLinkedWorker) && roleMatch;
      });

      if (!matchedAuth) {
        const msg = `Worker ${workerName} lacks required certification for role "${role}" on ${permit.permit_type ?? 'Permit'}.`;
        blockers.push(msg);
        evaluations.push({
          workerId: worker.id,
          workerName,
          roleOnPermit: role,
          isAuthorized: false,
          status: 'MISSING',
          expiryDate: null,
          daysToExpiry: null,
          certTitle: requiredCertTypes[0] ?? null,
          blockerMessage: msg
        });
        continue;
      }

      const isStatusValid = ['Authorized', 'Valid', 'Active'].includes(matchedAuth.authorization_status);
      const isExpired = Boolean(matchedAuth.expiry_date && todayStr && matchedAuth.expiry_date < todayStr);

      if (!isStatusValid || isExpired) {
        const msg = `Worker ${workerName} certification for role "${role}" is ${isExpired ? 'EXPIRED (' + matchedAuth.expiry_date + ')' : matchedAuth.authorization_status}.`;
        blockers.push(msg);
        evaluations.push({
          workerId: worker.id,
          workerName,
          roleOnPermit: role,
          isAuthorized: false,
          status: 'EXPIRED',
          expiryDate: matchedAuth.expiry_date ?? null,
          daysToExpiry: matchedAuth.days_to_expiry ?? -1,
          certTitle: matchedAuth.ptw_role,
          blockerMessage: msg
        });
        continue;
      }

      const daysToExpiry = matchedAuth.days_to_expiry ?? 365;
      const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;

      evaluations.push({
        workerId: worker.id,
        workerName,
        roleOnPermit: role,
        isAuthorized: true,
        status: isExpiringSoon ? 'EXPIRING_SOON' : 'VALID',
        expiryDate: matchedAuth.expiry_date,
        daysToExpiry,
        certTitle: matchedAuth.ptw_role,
        blockerMessage: null
      });
    }

    const authorizedCount = evaluations.filter((e) => e.isAuthorized).length;
    const blockedCount = evaluations.filter((e) => !e.isAuthorized).length;

    return {
      permitId: permit.id,
      permitType: permit.permit_type,
      cleared: blockers.length === 0,
      isFullyCompliant: blockers.length === 0,
      checkedAt: new Date().toISOString(),
      totalWorkers: workforce.length,
      authorizedCount,
      blockedCount,
      blockers,
      violations: blockers,
      evaluations,
      workers: evaluations.map((e) => ({
        userId: e.workerId,
        workerName: e.workerName,
        role: e.roleOnPermit,
        compliant: e.isAuthorized,
        missingOrExpiredCerts: !e.isAuthorized && e.certTitle ? [e.certTitle] : []
      }))
    };
  }

  /**
   * Asserts workforce competency before Permit Issue or Activation.
   * Throws BadRequestException if any required worker certification is missing or expired.
   */
  async assertCompetency(tenantId: string, permit: Record<string, any>): Promise<void> {
    const audit = await this.auditPermitWorkforce(tenantId, permit);
    if (!audit.isFullyCompliant) {
      throw new BadRequestException(
        `Permit authorization blocked by Competency Gate: ${audit.blockers.join(' ')}`
      );
    }
  }

  private resolveRequiredCertifications(role: string, permitType?: string): string[] {
    const normalizedRole = role.trim();
    if (this.HIGH_RISK_ROLES[normalizedRole]) {
      return this.HIGH_RISK_ROLES[normalizedRole];
    }

    // Role-specific matching by permit type
    if (permitType === 'CONFINED_SPACE' && (normalizedRole.includes('Entrant') || normalizedRole.includes('Attendant'))) {
      return ['Confined Space Entry', 'CSE Entrant', 'CSE Attendant'];
    }
    if (permitType === 'HOT_WORK' && normalizedRole.includes('Fire Watch')) {
      return ['Fire Watch', 'Hot Work Safety'];
    }
    if (normalizedRole.toLowerCase().includes('gas tester')) {
      return ['Authorized Gas Tester', 'Atmospheric Monitoring'];
    }

    return [];
  }

  private roleMatchesAuth(permitRole: string, authRole: string, requiredTypes: string[]): boolean {
    if (!authRole) return false;
    const normPermit = permitRole.toLowerCase();
    const normAuth = authRole.toLowerCase();
    if (normPermit === normAuth) return true;
    return requiredTypes.some((req) => normAuth.includes(req.toLowerCase()) || req.toLowerCase().includes(normAuth));
  }
}
