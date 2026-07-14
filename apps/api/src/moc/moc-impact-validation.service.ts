import { BadRequestException, Injectable } from '@nestjs/common';

type ImpactAnswer = { questionKey: string; value: unknown; justification?: string | null; metadata?: Record<string, unknown> };

const requiredQuestions = [
  'equipmentAffected',
  'chemistryAffected',
  'proceduresAffected',
  'operatingLimitsChanged',
  'safetySystemsAffected',
  'trainingRequired',
  'documentControlUpdateRequired',
  'environmentalImpactAffected',
  'productionImpactAffected'
];

@Injectable()
export class MocImpactValidationService {
  validateForSave(answers: Record<string, unknown>, justifications: Record<string, string | undefined> = {}) {
    const missing: string[] = [];
    const warnings: string[] = [];

    if (answers.equipmentAffected === true && !this.hasAny(answers.primaryEquipmentAffected, answers.additionalEquipmentAffected)) {
      missing.push('Equipment affected requires at least one equipment record.');
    }
    if (answers.equipmentAffected === true && answers.pidUpdateRequired === false && !justifications.pidUpdateRequired) {
      missing.push('P&ID update justification is required when equipment is affected but P&ID update is No.');
    }
    if (answers.trainingRequired === true && !this.hasAny(answers.affectedRoles)) {
      missing.push('Training required needs affected roles.');
    }
    if (answers.proceduresAffected === true && !this.hasAny(answers.affectedSops) && !justifications.proceduresAffected) {
      missing.push('Procedures affected requires affected SOPs or a written justification.');
    }
    if (answers.safetySystemsAffected === true && answers.lopaReviewRequired === undefined && answers.sisAffected === undefined) {
      missing.push('Safety system impact requires LOPA/SIS decision.');
    }
    if (answers.operatingLimitsChanged === true && answers.hazopDeviationReviewRequired === undefined) {
      missing.push('Operating limits changed requires HAZOP deviation review decision.');
    }
    if (answers.temporaryOperatingInstructionRequired === true && !answers.temporaryInstructionDocumentRequired && !justifications.temporaryOperatingInstructionRequired) {
      missing.push('Temporary operating instruction requires a document/action or justification.');
    }
    if (answers.likeForLikeReplacementConfirmed === true && this.anyTrue(answers.equipmentSpecificationChanged, answers.designRatingChanged, answers.materialOfConstructionChanged)) {
      warnings.push('Like-for-like selected while specification/design/material differs. Review whether this is truly like-for-like.');
    }

    return { missing, warnings, canComplete: missing.length === 0 && requiredQuestions.every((key) => answers[key] !== undefined && answers[key] !== '') };
  }

  validateForComplete(answers: Record<string, unknown>, justifications: Record<string, string | undefined> = {}) {
    const result = this.validateForSave(answers, justifications);
    const missingQuestions = requiredQuestions.filter((key) => answers[key] === undefined || answers[key] === '');
    if (missingQuestions.length) result.missing.push(`Required questions missing: ${missingQuestions.join(', ')}`);
    if (!result.canComplete) throw new BadRequestException(result.missing.join(' '));
    return result;
  }

  normalizeAnswers(payload: Record<string, any>) {
    const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : payload;
    const justifications = payload.justifications && typeof payload.justifications === 'object' ? payload.justifications : {};
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    return { answers, justifications, metadata };
  }

  toRows(answers: Record<string, unknown>, justifications: Record<string, string | undefined>, metadata: Record<string, any>): ImpactAnswer[] {
    return Object.entries(answers).map(([questionKey, value]) => ({ questionKey, value, justification: justifications[questionKey] ?? null, metadata: metadata[questionKey] ?? {} }));
  }

  private hasAny(...values: unknown[]) {
    return values.some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
  }

  private anyTrue(...values: unknown[]) {
    return values.some((value) => value === true);
  }
}
