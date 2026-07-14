import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class HazopFilterDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() studyType?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() leaderId?: string;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() linkedMocId?: string;
  @IsOptional() @IsBoolean() lopaRequired?: boolean;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsString() myStudies?: string;
}

export class CreateHazopStudyDto {
  @IsString() @MinLength(3) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['HAZOP', 'What-If', 'Checklist PHA', 'FMEA', 'Revalidation PHA', 'MOC-triggered PHA', 'Incident-triggered PHA', 'PSSR-triggered PHA'])
  studyType!: string;
  @IsOptional() @IsString() studyReason?: string;
  @IsOptional() @IsIn(['Low', 'Medium', 'High', 'Critical']) priority?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsString() siteId!: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() processSection?: string;
  @IsOptional() @IsArray() equipmentTags?: string[];
  @IsOptional() @IsArray() pidReferences?: string[];
  @IsOptional() @IsArray() relatedChemicals?: string[];
  @IsOptional() @IsString() scopeDescription?: string;
  @IsOptional() @IsString() outOfScopeDescription?: string;
  @IsOptional() @IsString() boundaries?: string;
  @IsOptional() @IsString() assumptions?: string;
  @IsOptional() @IsString() studyLeaderId?: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsString() scribeId?: string;
  @IsOptional() @IsString() riskMatrixId?: string;
  @IsOptional() @IsDateString() targetStartDate?: string;
  @IsOptional() @IsDateString() targetCompletionDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(120) revalidationIntervalMonths?: number;
  @IsOptional() @IsString() scopeSummary?: string;
  @IsOptional() @IsString() exclusions?: string;
  @IsOptional() @IsString() linkedMocId?: string;
  @IsOptional() @IsString() linkedPssrId?: string;
  @IsOptional() @IsString() linkedPtwId?: string;
  @IsOptional() @IsString() linkedIncidentId?: string;
  @IsOptional() @IsString() previousHazopId?: string;
  @IsOptional() @IsArray() teamMembers?: Array<Record<string, unknown>>;
  @IsOptional() @IsArray() linkedRecords?: Array<Record<string, unknown>>;
  @IsOptional() @IsArray() initialNodes?: Array<Record<string, unknown>>;
  @IsOptional() @IsIn(['draft', 'create', 'start-preparation']) createMode?: string;
  @IsOptional() settings?: Record<string, unknown>;
}

export class UpdateHazopStudyDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() studyLeaderId?: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsString() scribeId?: string;
  @IsOptional() @IsDateString() targetStartDate?: string;
  @IsOptional() @IsDateString() targetCompletionDate?: string;
  @IsOptional() @IsString() scopeSummary?: string;
  @IsOptional() @IsString() exclusions?: string;
}

export class CreateHazopNodeDto {
  @IsOptional() @IsString() nodeNumber?: string;
  @IsString() @MinLength(1) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() designIntent?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() parentNodeId?: string;
  @IsOptional() @IsArray() equipmentIds?: string[];
  @IsOptional() @IsArray() documentIds?: string[];
  @IsOptional() @IsArray() pidReferences?: string[];
  @IsOptional() equipmentLinks?: Record<string, unknown>[];
  @IsOptional() documentLinks?: Record<string, unknown>[];
  @IsOptional() parameterConfigurations?: Record<string, unknown>[];
  @IsOptional() selectedParameters?: string[];
  @IsOptional() @IsString() complexId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() normalOperatingConditions?: string;
  @IsOptional() processConditionsJson?: Record<string, unknown>;
  @IsOptional() @IsString() processConditions?: string;
  @IsOptional() @IsString() boundaries?: string;
  @IsOptional() @IsString() boundaryLimits?: string;
  @IsOptional() @IsArray() relatedChemicalIds?: string[];
  @IsOptional() @IsString() assumptions?: string;
  @IsOptional() @IsString() exclusions?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() status?: string;
}

export class CreateHazopScenarioDto {
  @IsOptional() @IsString() nodeId!: string;
  @IsOptional() @IsString() deviationId?: string;
  @IsOptional() @IsString() guideword?: string;
  @IsOptional() @IsString() parameter?: string;
  @IsOptional() @IsString() deviation?: string;
  @IsOptional() @IsString() deviationText?: string;
  @IsString() cause!: string;
  @IsString() consequence!: string;
  @IsOptional() @IsString() existingSafeguards?: string;
  @IsInt() @Min(1) @Max(5) severity!: number;
  @IsInt() @Min(1) @Max(5) likelihood!: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) residualSeverity?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) residualLikelihood?: number;
  @IsOptional() @IsBoolean() recommendationRequired?: boolean;
  @IsOptional() @IsBoolean() lopaRequired?: boolean;
  @IsOptional() @IsString() lopaTriggerReason?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ReorderHazopNodesDto {
  @IsArray() nodeIds!: string[];
}

export class BulkGenerateHazopScenariosDto {
  @IsString() nodeId!: string;
  @IsArray() guidewords!: string[];
  @IsArray() parameters!: string[];
  @IsOptional() @IsIn(['all', 'common', 'template']) mode?: string;
}

export class HazopSafeguardDto {
  @IsOptional() @IsString() safeguardType?: string;
  @IsOptional() @IsString() safeguardName?: string;
  @IsOptional() @IsString() safeguardCategory?: string;
  @IsString() @MinLength(2) description!: string;
  @IsOptional() @IsString() existingOrProposed?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @IsString() documentVersionId?: string;
  @IsOptional() @IsString() effectiveness?: string;
  @IsOptional() @IsBoolean() creditedForRiskReduction?: boolean;
  @IsOptional() @IsBoolean() iplCandidate?: boolean;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsBoolean() proofTestRequired?: boolean;
  @IsOptional() @IsBoolean() inspectionRequired?: boolean;
  @IsOptional() @IsBoolean() evidenceRequired?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() safetySystemType?: string;
  @IsOptional() @IsString() sifTag?: string;
  @IsOptional() @IsString() interlockId?: string;
  @IsOptional() @IsString() tripSetpoint?: string;
  @IsOptional() @IsString() finalElement?: string;
  @IsOptional() @IsString() sensorTransmitter?: string;
  @IsOptional() @IsString() logicSolver?: string;
  @IsOptional() @IsString() targetSil?: string;
  @IsOptional() @IsString() proofTestInterval?: string;
}

export class HazopIplValidationDto {
  @IsArray() items!: Array<Record<string, unknown>>;
  @IsOptional() @IsString() validationSummary?: string;
}

export class HazopSafeguardLinkDto {
  @IsString() id!: string;
  @IsOptional() @IsString() linkType?: string;
  @IsOptional() @IsString() documentVersionId?: string;
  @IsOptional() @IsString() documentType?: string;
}

export class HazopSafeguardTestStatusDto {
  @IsOptional() @IsBoolean() proofTestRequired?: boolean;
  @IsOptional() @IsBoolean() inspectionRequired?: boolean;
  @IsOptional() @IsString() testFrequency?: string;
  @IsOptional() @IsDateString() lastTestDate?: string;
  @IsOptional() @IsDateString() nextTestDueDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() evidenceAttachmentId?: string;
  @IsOptional() @IsString() linkedMiRecordId?: string;
  @IsOptional() @IsString() ownerId?: string;
}

export class HazopSafeguardGapDto {
  @IsString() gapType!: string;
  @IsString() @MinLength(3) gapDescription!: string;
  @IsOptional() @IsIn(['Low', 'Medium', 'High', 'Critical']) severity?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class HazopSafeguardActionDto {
  @IsOptional() @IsString() actionId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class HazopRiskUpdateDto {
  @IsInt() @Min(1) @Max(5) severity!: number;
  @IsInt() @Min(1) @Max(5) likelihood!: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) residualSeverity?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) residualLikelihood?: number;
  @IsOptional() @IsString() comment?: string;
}

export class HazopRiskAcceptanceDto {
  @IsIn(['Temporary acceptance', 'Management acceptance', 'ALARP justification', 'No further action justified'])
  acceptanceType!: string;
  @IsString() @MinLength(10) justification!: string;
  @IsOptional() @IsString() conditions?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsDateString() reviewDate?: string;
  @IsOptional() @IsString() approverId?: string;
  @IsOptional() @IsString() attachmentId?: string;
}

export class HazopRiskAcceptanceDecisionDto {
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() reason?: string;
}

export class HazopRiskBulkOwnerDto {
  @IsArray() scenarioIds!: string[];
  @IsString() ownerId!: string;
}

export class HazopRiskBulkLopaDto {
  @IsArray() scenarioIds!: string[];
  @IsString() reason!: string;
}

export class CreateHazopRecommendationDto {
  @IsOptional() @IsString() nodeId?: string;
  @IsOptional() @IsString() scenarioId?: string;
  @IsOptional() @IsString() safeguardId?: string;
  @IsOptional() @IsString() riskAssessmentId?: string;
  @IsOptional() @IsString() lopaTriggerId?: string;
  @IsOptional() @IsIn(['Scenario', 'High/Critical Risk', 'Safeguard Gap', 'IPL Validation Failure', 'LOPA Trigger', 'Team Decision', 'MOC Requirement', 'PSSR Blocker', 'Manual']) sourceType?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() @MinLength(3) recommendationText?: string;
  @IsOptional() @IsString() @MinLength(3) description?: string;
  @IsOptional() @IsString() rationale?: string;
  @IsIn(['Low', 'Medium', 'High', 'Critical', 'Safety Critical']) priority!: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() verificationRequired?: boolean;
  @IsOptional() @IsBoolean() evidenceRequired?: boolean;
  @IsOptional() @IsBoolean() closureBlocker?: boolean;
  @IsOptional() @IsBoolean() lopaRelated?: boolean;
  @IsOptional() @IsString() actionCreationMode?: string;
  @IsOptional() @IsString() linkedActionId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class HazopRecommendationEvidenceDto {
  @IsIn(['Photo', 'PDF', 'Calculation', 'Procedure update', 'P&ID update', 'Training record', 'Test record', 'Inspection record', 'Meeting minutes', 'Management approval', 'Other'])
  evidenceType!: string;
  @IsOptional() @IsString() attachmentId?: string;
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @IsString() documentVersionId?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() storagePath?: string;
  @IsOptional() @IsString() comment?: string;
}

export class HazopRecommendationVerificationDto {
  @IsOptional() @IsIn(['Accepted', 'Rejected', 'Needs rework'])
  decision?: string;
  @IsOptional() @IsString() verificationComment?: string;
  @IsOptional() @IsString() reason?: string;
}

export class HazopRecommendationDeferralDto {
  @IsString() @MinLength(5) deferralReason!: string;
  @IsDateString() newDueDate!: string;
  @IsOptional() @IsString() approvedBy?: string;
}

export class HazopRecommendationActionDto {
  @IsOptional() @IsString() actionId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class HazopTeamMemberDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() externalName?: string;
  @IsOptional() @IsString() externalEmail?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() contractorCompanyId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsString() discipline!: string;
  @IsString() studyRole!: string;
  @IsOptional() @IsIn(['View only', 'Comment', 'Edit worksheet', 'Approve/sign-off']) permissionLevel?: string;
  @IsOptional() @IsBoolean() requiredAttendance?: boolean;
  @IsOptional() @IsBoolean() signoffRequired?: boolean;
  @IsOptional() @IsIn(['All sessions', 'Selected sessions', 'Review only']) attendanceRequirement?: string;
  @IsOptional() @IsIn(['Invited', 'Active', 'Declined', 'Removed', 'Replaced', 'Inactive']) status?: string;
  @IsOptional() @IsString() notes?: string;
}

export class HazopTeamReplaceDto {
  @IsOptional() @IsString() replacementMemberId?: string;
  @IsOptional() replacement?: Record<string, unknown>;
  @IsOptional() @IsString() reason?: string;
}

export class HazopSessionDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsIn(['Kickoff', 'Node review', 'HAZOP worksheet session', 'Risk review', 'Recommendation review', 'Closeout review', 'Approval review', 'Revalidation session', 'Other']) sessionType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() sessionDate?: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() meetingLink?: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsString() scribeId?: string;
  @IsOptional() @IsArray() plannedNodeIds?: string[];
  @IsOptional() @IsString() agenda?: string;
  @IsOptional() @IsIn(['Planned', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Missed']) status?: string;
}

export class HazopSessionRescheduleDto {
  @IsDateString() sessionDate!: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @IsString() reason?: string;
}

export class HazopAttendanceDto {
  @IsOptional() @IsString() teamMemberId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsIn(['Present', 'Absent', 'Partial', 'Excused', 'Substitute Attended', 'Not Required']) attendanceStatus!: string;
  @IsOptional() @IsDateString() joinTime?: string;
  @IsOptional() @IsDateString() leaveTime?: string;
  @IsOptional() @IsInt() durationMinutes?: number;
  @IsOptional() @IsString() substituteName?: string;
  @IsOptional() @IsString() substituteUserId?: string;
  @IsOptional() @IsString() comment?: string;
}

export class HazopBulkAttendanceDto {
  @IsArray() records!: HazopAttendanceDto[];
}

export class HazopSessionMinutesDto {
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() discussionNotes?: string;
  @IsOptional() @IsArray() nodesReviewed?: string[];
  @IsOptional() @IsString() keyDeviationsDiscussed?: string;
  @IsOptional() @IsString() risksEscalated?: string;
  @IsOptional() @IsString() recommendationsCreated?: string;
  @IsOptional() @IsString() decisionsMade?: string;
  @IsOptional() @IsString() openQuestions?: string;
  @IsOptional() @IsString() nextSessionPlan?: string;
  @IsOptional() @IsString() reviewedBy?: string;
  @IsOptional() @IsString() approvedBy?: string;
  @IsOptional() @IsString() status?: string;
}

export class HazopSessionDecisionDto {
  @IsString() @MinLength(2) decisionTitle!: string;
  @IsOptional() @IsString() decisionDescription?: string;
  @IsIn(['Risk acceptance', 'Recommendation required', 'LOPA required', 'Safeguard accepted', 'Node complete', 'Study scope change', 'Other']) decisionType!: string;
  @IsOptional() @IsString() nodeId?: string;
  @IsOptional() @IsString() scenarioId?: string;
  @IsOptional() @IsString() recommendationId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() decisionDate?: string;
}

export class HazopSessionActionDto {
  @IsOptional() @IsString() actionId?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsIn(['Low', 'Medium', 'High', 'Critical']) priority?: string;
  @IsOptional() @IsString() nodeId?: string;
  @IsOptional() @IsString() scenarioId?: string;
  @IsOptional() @IsBoolean() requiredBeforeSessionCompletion?: boolean;
  @IsOptional() @IsBoolean() verificationRequired?: boolean;
  @IsOptional() @IsBoolean() evidenceRequired?: boolean;
}

export class HazopCommentDto {
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() reason?: string;
}
