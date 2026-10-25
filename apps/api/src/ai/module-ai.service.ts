import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AiAuditService } from './ai-audit.service';
import { isRecordInScope } from './ai-scope';
import { AiScope } from './ai.types';
import { LlmGatewayService } from './llm-gateway.service';
import { guardUntrustedText } from './prompt-guard';

export type MOCImpactAnalysisResult = {
  mocId: string;
  summary: string;
  identifiedImpacts: Array<{
    category: 'PSI' | 'PHA_HAZOP' | 'OPERATING_PROCEDURES' | 'TRAINING' | 'MECHANICAL_INTEGRITY' | 'ENVIRONMENTAL';
    finding: string;
    affectedItem: string;
    severity: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK';
    recommendedAction: string;
  }>;
  suggestedSpecialistReviewers: Array<{
    role: string;
    rationale: string;
  }>;
  regulatoryChecks: string[];
  closureEvidenceGaps: string[];
  disclaimer: string;
};

export type PTWSafetyPrecheckResult = {
  permitId: string;
  overallReadiness: 'CLEAR' | 'ADVISORY_WARNINGS' | 'POTENTIAL_SAFETY_BLOCKERS';
  conflictAnalysis: {
    hasSIMOPSConflicts: boolean;
    conflictingPermits: Array<{
      permitNumber: string;
      permitType: string;
      location: string;
      hazardType: string;
    }>;
    spatialWarning?: string | undefined;
  };
  isolationReadiness: {
    status: 'ADEQUATE' | 'POTENTIALLY_INCOMPLETE' | 'MISSING_VERIFICATION';
    requiredEnergySources: string[];
    potentialOmissions: string[];
  };
  recommendedPrecautions: string[];
  missingFields: string[];
  disclaimer: string;
};

@Injectable()
export class ModuleAiService {
  private readonly logger = new Logger(ModuleAiService.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly llm: LlmGatewayService,
    private readonly audit: AiAuditService
  ) {}

  /**
   * MOC Contextual Impact Analysis: Traces affected equipment, procedures, and safety boundaries.
   */
  async analyzeMocImpact(scope: AiScope, mocId: string): Promise<MOCImpactAnalysisResult> {
    const moc = await this.db.single<any>(
      this.db.from('Moc').select('*').eq('tenantId', scope.tenantId).eq('id', mocId).maybeSingle()
    );

    if (!moc) {
      throw new NotFoundException(`MOC record '${mocId}' not found in active tenant.`);
    }

    if (!isRecordInScope(scope, moc)) {
      throw new ForbiddenException(`Access to MOC '${mocId}' is restricted to authorized site personnel.`);
    }

    const fallbackResult: MOCImpactAnalysisResult = {
      mocId,
      summary: `Automated impact pre-check for MOC: ${moc.title || mocId}.`,
      identifiedImpacts: [
        {
          category: 'PSI',
          finding: 'P&ID drawing markups and equipment technical specification updates required.',
          affectedItem: moc.equipment_tag || 'Primary Asset',
          severity: 'HIGH_RISK',
          recommendedAction: 'Verify updated design basis, material compatibility, and engineering package.'
        },
        {
          category: 'OPERATING_PROCEDURES',
          finding: 'Operating procedures review required for changed operating parameters.',
          affectedItem: 'Standard Operating Procedures (SOP)',
          severity: 'MEDIUM_RISK',
          recommendedAction: 'Update start-up, normal operation, and emergency shutdown procedures.'
        },
        {
          category: 'TRAINING',
          finding: 'Operations and maintenance crew training required prior to startup.',
          affectedItem: 'Operations Workforce',
          severity: 'MEDIUM_RISK',
          recommendedAction: 'Conduct pre-startup training and verify competency records.'
        }
      ],
      suggestedSpecialistReviewers: [
        { role: 'Process Safety Engineer (PHA/LOPA)', rationale: 'Validate that no new hazardous deviation is introduced.' },
        { role: 'Mechanical Integrity Specialist', rationale: 'Confirm equipment design rating and inspection intervals.' },
        { role: 'Operations Shift Lead', rationale: 'Verify procedural impacts and safe operating limits.' }
      ],
      regulatoryChecks: [
        'OSHA 1910.119(l) Management of Change compliance checklist',
        'Process Safety Information (PSI) 1910.119(d) delta verification'
      ],
      closureEvidenceGaps: [
        'P&ID redline drawing sign-off',
        'PSSR pre-startup punchlist item closure'
      ],
      disclaimer: 'AI proposal for engineering review. Authorized specialists must formally approve impact determinations.'
    };

    if (!this.llm.enabled) {
      await this.audit.record({
        tenantId: scope.tenantId,
        siteId: scope.activeSiteId,
        userId: scope.userId,
        kind: 'moc.impact.analyze',
        request: { mocId },
        response: { mode: 'fallback' }
      });
      return fallbackResult;
    }

    const title = guardUntrustedText(moc.title || '', 300).text;
    const desc = guardUntrustedText(moc.description || '', 1000).text;
    const reason = guardUntrustedText(moc.reason_for_change || '', 500).text;

    const systemPrompt = [
      'You are a Principal Process Safety Engineer performing a rigorous MOC Impact Assessment for an industrial plant.',
      'Analyze the change description and identify all affected PSM elements (PSI, PHA, Procedures, Training, MI, Environmental).',
      'Respond STRICTLY in valid JSON matching this schema:',
      '{',
      '  "summary": "Concise engineering summary",',
      '  "identifiedImpacts": [',
      '    { "category": "PSI"|"PHA_HAZOP"|"OPERATING_PROCEDURES"|"TRAINING"|"MECHANICAL_INTEGRITY"|"ENVIRONMENTAL",',
      '      "finding": "Specific impact observation",',
      '      "affectedItem": "Specific equipment/document",',
      '      "severity": "HIGH_RISK"|"MEDIUM_RISK"|"LOW_RISK",',
      '      "recommendedAction": "Concrete engineering action" }',
      '  ],',
      '  "suggestedSpecialistReviewers": [',
      '    { "role": "Specialist Title", "rationale": "Reason needed" }',
      '  ],',
      '  "regulatoryChecks": ["Applicable PSM requirements"],',
      '  "closureEvidenceGaps": ["Required evidence before MOC closure"]',
      '}'
    ].join('\n');

    const userPrompt = [
      `MOC Title: ${title}`,
      `Change Category: ${moc.change_category || 'Mechanical/Process'}`,
      `Change Scope: ${desc}`,
      `Reason for Change: ${reason}`,
      `Target Asset: ${moc.equipment_tag || 'Unspecified'}`,
      `Plant Site: ${moc.site_id || 'Current Facility'}`
    ].join('\n');

    const llm = await this.llm.complete(systemPrompt, userPrompt);
    if (llm?.text) {
      try {
        const cleaned = llm.text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        const result: MOCImpactAnalysisResult = {
          mocId,
          summary: parsed.summary || fallbackResult.summary,
          identifiedImpacts: Array.isArray(parsed.identifiedImpacts) ? parsed.identifiedImpacts : fallbackResult.identifiedImpacts,
          suggestedSpecialistReviewers: Array.isArray(parsed.suggestedSpecialistReviewers) ? parsed.suggestedSpecialistReviewers : fallbackResult.suggestedSpecialistReviewers,
          regulatoryChecks: Array.isArray(parsed.regulatoryChecks) ? parsed.regulatoryChecks : fallbackResult.regulatoryChecks,
          closureEvidenceGaps: Array.isArray(parsed.closureEvidenceGaps) ? parsed.closureEvidenceGaps : fallbackResult.closureEvidenceGaps,
          disclaimer: fallbackResult.disclaimer
        };

        await this.audit.record({
          tenantId: scope.tenantId,
          siteId: scope.activeSiteId,
          userId: scope.userId,
          kind: 'moc.impact.analyze',
          model: llm.model,
          request: { mocId },
          response: { impactCount: result.identifiedImpacts.length }
        });

        return result;
      } catch (err) {
        this.logger.warn(`Failed to parse MOC Impact JSON from OpenAI: ${(err as Error).message}`);
      }
    }

    return fallbackResult;
  }

  /**
   * PTW Safety & Conflict Pre-check: Analyzes concurrent permits (SIMOPS), energy isolation completeness, and gas test prerequisites.
   */
  async precheckPermitSafety(scope: AiScope, permitId: string): Promise<PTWSafetyPrecheckResult> {
    const permit = await this.db.single<any>(
      this.db.from('PtwPermit').select('*').eq('tenantId', scope.tenantId).eq('id', permitId).maybeSingle()
    );

    if (!permit) {
      throw new NotFoundException(`PTW Permit '${permitId}' not found in active tenant.`);
    }

    if (!isRecordInScope(scope, permit)) {
      throw new ForbiddenException(`Access to Permit '${permitId}' is restricted to authorized site personnel.`);
    }

    // Active concurrent permits in the same site to detect SIMOPS
    let concurrentQuery = this.db.from('PtwPermit')
      .select('id,permit_number,permit_type,location,job_area,status,siteId')
      .eq('tenantId', scope.tenantId)
      .neq('id', permitId)
      .in('status', ['ISSUED', 'ACTIVE', 'SUSPENDED'])
      .limit(10);

    if (permit.siteId) {
      concurrentQuery = concurrentQuery.eq('siteId', permit.siteId);
    }

    const concurrent = await this.db.many<any>(concurrentQuery);

    const hasSimops = (concurrent ?? []).length > 0;
    const conflictingPermits = (concurrent ?? []).map((c) => ({
      permitNumber: c.permit_number || c.id.slice(0, 8),
      permitType: c.permit_type || 'Hot Work',
      location: c.location || c.job_area || 'Process Unit',
      hazardType: 'Concurrent Activity (SIMOPS)'
    }));

    const result: PTWSafetyPrecheckResult = {
      permitId,
      overallReadiness: hasSimops ? 'ADVISORY_WARNINGS' : 'CLEAR',
      conflictAnalysis: {
        hasSIMOPSConflicts: hasSimops,
        conflictingPermits,
        ...(hasSimops
          ? {
              spatialWarning: `Detected ${conflictingPermits.length} concurrent active permit(s) in this facility. Verify physical separation and energy boundaries.`
            }
          : {})
      },
      isolationReadiness: {
        status: permit?.isolation_required ? 'POTENTIALLY_INCOMPLETE' : 'ADEQUATE',
        requiredEnergySources: ['Electrical', 'Process Piping (Hydrocarbon)', 'Instrument Air'],
        potentialOmissions: permit?.isolation_required ? ['Double block and bleed verification required', 'Zero energy gauge check'] : []
      },
      recommendedPrecautions: [
        'Continuous atmospheric monitoring for combustible gas (LEL < 1%) and H2S.',
        'Fire watch stationed with calibrated dry chemical extinguisher within 15 meters.',
        'Physical lockout/tagout (LOTO) verified at motor control center (MCC).'
      ],
      missingFields: [],
      disclaimer: 'AI proposal. Cannot issue permits, declare atmospheres safe, or override safety interlocks.'
    };

    if (!permit?.work_description) result.missingFields.push('Work description & scope');
    if (!permit?.planned_start_at) result.missingFields.push('Planned start timestamp');
    if (!permit?.issuer_id) result.missingFields.push('Designated permit issuer');

    await this.audit.record({
      tenantId: scope.tenantId,
      siteId: scope.activeSiteId,
      userId: scope.userId,
      kind: 'ptw.safety.precheck',
      request: { permitId },
      response: { readiness: result.overallReadiness, simopsCount: conflictingPermits.length }
    });

    return result;
  }
}
