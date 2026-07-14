import { IsArray, IsBoolean, IsDateString, IsIn, IsNumber, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class LopaFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsString() calculationStatus?: string;
  @IsOptional() @IsString() iplValidationStatus?: string;
  @IsOptional() @IsString() silGapStatus?: string;
  @IsOptional() @IsString() targetSil?: string;
  @IsOptional() silRequired?: string | boolean;
  @IsOptional() overdue?: string | boolean;
  @IsOptional() revalidationDue?: string | boolean;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class LopaSilActionDto {
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() methodologyReference?: string;
  @IsOptional() @IsString() targetSil?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() existingSifId?: string;
  @IsOptional() @IsBoolean() existingSifAdequate?: boolean;
  @IsOptional() @IsBoolean() newSifRequired?: boolean;
  @IsOptional() @IsBoolean() manualOverride?: boolean;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() dueDate?: string;
}

export class UpsertLopaSifComponentDto {
  @IsString() componentType!: string;
  @IsOptional() @IsString() componentTag?: string;
  @IsOptional() @IsString() componentName?: string;
  @IsOptional() @IsString() componentDescription?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() processVariable?: string;
  @IsOptional() @IsString() rangeText?: string;
  @IsOptional() @IsString() setpoint?: string;
  @IsOptional() @IsString() votingGroup?: string;
  @IsOptional() @IsString() actionOnTrip?: string;
  @IsOptional() @IsString() failPosition?: string;
  @IsOptional() @IsString() responseTime?: string;
  @IsOptional() @IsString() diagnostics?: string;
  @IsOptional() @IsString() independenceNotes?: string;
  @IsOptional() @IsString() proofTestRequirement?: string;
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class UpsertLopaSifArchitectureDto {
  @IsOptional() @IsString() architectureStatus?: string;
  @IsOptional() @IsString() sensorVoting?: string;
  @IsOptional() @IsString() logicSolverArchitecture?: string;
  @IsOptional() @IsString() finalElementVoting?: string;
  @IsOptional() @IsString() overallArchitecture?: string;
  @IsOptional() @IsString() redundancyRequirement?: string;
  @IsOptional() @IsString() diagnosticCoverageAssumption?: string;
  @IsOptional() @IsString() commonCauseConsideration?: string;
  @IsOptional() @IsNumber() betaFactor?: number;
  @IsOptional() @IsString() spuriousTripConcern?: string;
  @IsOptional() @IsString() independenceFromBpcs?: string;
  @IsOptional() @IsString() independenceFromInitiatingEvent?: string;
  @IsOptional() @IsString() independenceFromOtherIpls?: string;
  @IsOptional() @IsString() architectureNotes?: string;
  @IsOptional() @IsString() architectureDocumentId?: string;
}

export class UpsertLopaSifProofTestDto {
  @IsOptional() @IsBoolean() proofTestRequired?: boolean;
  @IsOptional() @IsString() proofTestInterval?: string;
  @IsOptional() @IsString() proofTestProcedureDocumentId?: string;
  @IsOptional() @IsBoolean() partialStrokeTestRequired?: boolean;
  @IsOptional() @IsBoolean() functionalTestRequired?: boolean;
  @IsOptional() @IsDateString() lastProofTestDate?: string;
  @IsOptional() @IsDateString() nextProofTestDue?: string;
  @IsOptional() @IsString() proofTestCoverageAssumption?: string;
  @IsOptional() @IsString() maintenanceBasis?: string;
  @IsOptional() @IsString() miProgramId?: string;
  @IsOptional() @IsBoolean() bypassAllowed?: boolean;
  @IsOptional() @IsBoolean() bypassApprovalRequired?: boolean;
  @IsOptional() @IsBoolean() bypassRiskAssessmentRequired?: boolean;
  @IsOptional() @IsString() maximumBypassDuration?: string;
  @IsOptional() @IsString() bypassLogReference?: string;
  @IsOptional() @IsString() overrideManagementNotes?: string;
  @IsOptional() @IsString() inspectionMaintenanceOwnerId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpsertLopaSilLinkDto {
  @IsString() linkedRecordType!: string;
  @IsString() linkedRecordId!: string;
  @IsOptional() @IsString() sifSpecificationId?: string;
  @IsOptional() @IsString() linkedRecordNumber?: string;
  @IsOptional() @IsString() linkedRecordTitle?: string;
  @IsOptional() @IsString() sourceModule?: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsString() statusSnapshot?: string;
  @IsOptional() @IsString() revisionSnapshot?: string;
  @IsOptional() @IsString() reason?: string;
}

export class CreateLopaSilActionDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() ownerId!: string;
  @IsString() priority!: string;
  @IsDateString() dueDate!: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceRecordId?: string;
  @IsOptional() @IsString() sifSpecificationId?: string;
  @IsOptional() @IsBoolean() blocking?: boolean;
}

export class LopaAttachmentFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() attachmentType?: string;
  @IsOptional() @IsString() evidenceCategory?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() accessLevel?: string;
  @IsOptional() @IsString() uploadedBy?: string;
  @IsOptional() @IsString() fileType?: string;
  @IsOptional() @IsString() requiredEvidence?: string;
  @IsOptional() @IsString() restricted?: string;
  @IsOptional() @IsString() archived?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() eventType?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() hasDiff?: string;
  @IsOptional() @IsString() workflowOnly?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class UpsertLopaAttachmentDto {
  @IsOptional() @IsString() fileName?: string;
  @IsString() attachmentType!: string;
  @IsOptional() @IsString() evidenceCategory?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() relatedRecordType?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsOptional() @IsBoolean() requiredEvidence?: boolean;
  @IsOptional() @IsString() evidencePurpose?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() accessLevel?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsString() sourceReference?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsBoolean() confidential?: boolean;
  @IsOptional() @IsBoolean() restricted?: boolean;
  @IsOptional() @IsBoolean() externalSharingAllowed?: boolean;
  @IsOptional() @IsString() retentionCategory?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() permissionNotes?: string;
  @IsOptional() @IsString() status?: string;
}

export class LopaAttachmentDocumentLinkDto {
  @IsString() documentId!: string;
  @IsOptional() @IsString() attachmentId?: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsBoolean() requiredEvidence?: boolean;
  @IsOptional() @IsString() reason?: string;
}

export class LopaEvidenceMappingDto {
  @IsOptional() @IsString() attachmentId?: string;
  @IsOptional() @IsString() documentLinkId?: string;
  @IsString() relatedTab!: string;
  @IsOptional() @IsString() relatedRecordType?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsString() evidencePurpose!: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() blockingIfMissing?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reason?: string;
}

export class LopaAttachmentCommentDto {
  @IsString() commentText!: string;
  @IsOptional() @IsString() commentType?: string;
  @IsOptional() @IsString() status?: string;
}

export class LopaAttachmentBulkDto {
  @IsArray() attachmentIds!: string[];
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() evidenceCategory?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() reason?: string;
}

export class LopaFinalReportFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() reportType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() outputFormat?: string;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsString() official?: string;
  @IsOptional() @IsString() published?: string;
  @IsOptional() @IsString() generatedBy?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() failedExports?: string;
  @IsOptional() @IsString() superseded?: string;
  @IsOptional() @IsString() archived?: string;
  @IsOptional() @IsString() documentControlPublished?: string;
  @IsOptional() @IsString() reportPackage?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class LopaReportSectionConfigDto {
  @IsString() sectionKey!: string;
  @IsOptional() @IsBoolean() included?: boolean;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
}

export class LopaReportSectionsDto {
  @IsArray() sections!: LopaReportSectionConfigDto[];
  @IsOptional() @IsString() reason?: string;
}

export class LopaReportGenerateDto {
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsString() reportType?: string;
  @IsOptional() @IsString() outputFormat?: string;
  @IsOptional() @IsBoolean() official?: boolean;
  @IsOptional() @IsBoolean() draft?: boolean;
  @IsOptional() @IsBoolean() redacted?: boolean;
  @IsOptional() @IsBoolean() includeAppendices?: boolean;
  @IsOptional() @IsBoolean() includeAttachmentsIndex?: boolean;
  @IsOptional() @IsBoolean() includeFullHistory?: boolean;
  @IsOptional() @IsBoolean() includeSignatures?: boolean;
  @IsOptional() @IsBoolean() includeApprovalSnapshot?: boolean;
  @IsOptional() @IsBoolean() includeRestrictedData?: boolean;
  @IsOptional() @IsString() redactionMode?: string;
  @IsOptional() @IsString() watermark?: string;
  @IsOptional() @IsString() fileName?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() sectionKeys?: string[];
  @IsOptional() @IsObject() options?: Record<string, unknown>;
}

export class LopaReportPackageDto extends LopaReportGenerateDto {
  @IsOptional() @IsString() packageName?: string;
  @IsOptional() @IsArray() includedFiles?: string[];
  @IsOptional() @IsArray() includedAppendices?: string[];
  @IsOptional() @IsArray() attachmentIds?: string[];
}

export class LopaReportPublishDto {
  @IsOptional() @IsString() documentTitle?: string;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsString() classification?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaReportShareDto {
  @IsString() recipientEmail!: string;
  @IsOptional() @IsString() recipientUserId?: string;
  @IsOptional() @IsString() recipientRole?: string;
  @IsOptional() @IsString() distributionMethod?: string;
  @IsOptional() @IsDateString() accessExpiresAt?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpsertLopaSifDto {
  @IsString() title!: string;
  @IsOptional() @IsString() sifTag?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sifType?: string;
  @IsOptional() @IsString() safetyFunction?: string;
  @IsOptional() @IsString() hazardousEventPrevented?: string;
  @IsOptional() @IsString() consequenceMitigated?: string;
  @IsOptional() @IsString() processDemandDetected?: string;
  @IsOptional() @IsString() initiatingCauseAddressed?: string;
  @IsOptional() @IsString() requiredAction?: string;
  @IsOptional() @IsString() targetSil?: string;
  @IsOptional() @IsString() safeState?: string;
  @IsOptional() @IsString() tripSetpoint?: string;
  @IsOptional() @IsString() tripSetpointUnits?: string;
  @IsOptional() @IsString() setpointBasis?: string;
  @IsOptional() @IsString() resetRequirement?: string;
  @IsOptional() @IsString() resetPhilosophy?: string;
  @IsOptional() @IsBoolean() manualResetRequired?: boolean;
  @IsOptional() @IsString() processAction?: string;
  @IsOptional() @IsString() operatingMode?: string;
  @IsOptional() @IsString() demandMode?: string;
  @IsOptional() @IsString() responseTime?: string;
  @IsOptional() @IsString() responseTimeRequired?: string;
  @IsOptional() @IsString() responseTimeAvailable?: string;
  @IsOptional() @IsString() bypassManagement?: string;
  @IsOptional() @IsString() proofTestInterval?: string;
  @IsOptional() @IsString() proofTestBasis?: string;
  @IsOptional() @IsString() maintenanceRequirements?: string;
  @IsOptional() @IsString() equipmentSystem?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() designOwnerId?: string;
  @IsOptional() @IsString() operationsOwnerId?: string;
  @IsOptional() @IsString() maintenanceOwnerId?: string;
  @IsOptional() @IsString() functionalSafetySpecialistId?: string;
  @IsOptional() @IsNumber() requiredRrf?: number;
  @IsOptional() @IsNumber() requiredPfdavg?: number;
  @IsOptional() @IsNumber() expectedPfdavg?: number;
  @IsOptional() @IsBoolean() srsRequired?: boolean;
  @IsOptional() @IsBoolean() silVerificationRequired?: boolean;
  @IsOptional() @IsBoolean() validationRequired?: boolean;
  @IsOptional() @IsBoolean() proofTestRequired?: boolean;
  @IsOptional() @IsBoolean() mocRequired?: boolean;
  @IsOptional() @IsBoolean() pssrRequired?: boolean;
  @IsOptional() @IsBoolean() miRequired?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() assumptions?: string;
  @IsOptional() @IsString() limitations?: string;
  @IsOptional() @IsBoolean() complete?: boolean;
}

export class UpsertLopaSilGapDto {
  @IsString() requirementKey!: string;
  @IsString() requirementTitle!: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() mandatory?: boolean;
  @IsOptional() @IsBoolean() closureBlocker?: boolean;
  @IsOptional() @IsString() finding?: string;
  @IsOptional() @IsString() evidenceReference?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() exceptionReason?: string;
}

export class LopaConsequenceDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() impactedReceptor?: string;
  @IsOptional() @IsNumber() tolerableEventFrequency?: number;
  @IsOptional() @IsString() riskCriteriaSource?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaInitiatingEventDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() eventCategory?: string;
  @IsOptional() @IsString() frequencyMethod?: string;
  @IsOptional() @IsString() libraryEvent?: string;
  @IsOptional() @IsNumber() frequencyPerYear?: number;
  @IsOptional() @IsString() frequencySource?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaImportedSafeguardDto {
  @IsOptional() @IsString() sourceSafeguardId?: string;
  @IsString() safeguardName!: string;
  @IsOptional() @IsString() safeguardType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() proposedLopaUse?: string;
  @IsOptional() @IsBoolean() creditedAsIpl?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class LopaTeamMemberDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() email?: string;
  @IsString() role!: string;
  @IsOptional() @IsString() discipline?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsString() organization?: string;
  @IsOptional() @IsString() internalExternal?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() responsibility?: string;
  @IsOptional() @IsBoolean() reviewer?: boolean;
  @IsOptional() @IsBoolean() approver?: boolean;
  @IsOptional() @IsBoolean() facilitator?: boolean;
  @IsOptional() @IsBoolean() scribe?: boolean;
  @IsOptional() @IsString() accessLevel?: string;
  @IsOptional() @IsBoolean() invitationRequired?: boolean;
  @IsOptional() @IsString() invitationMode?: string;
  @IsOptional() @IsString() invitationMessage?: string;
  @IsOptional() @IsDateString() invitationDueDate?: string;
  @IsOptional() @IsArray() suggestionReasons?: string[];
  @IsOptional() @IsString() suggestionSource?: string;
}

export class CreateLopaDto {
  @IsString() @MinLength(3) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() studyType!: string;
  @IsString() source!: string;
  @IsOptional() @IsString() sourceModule?: string;
  @IsOptional() @IsString() sourceRecordId?: string;
  @IsOptional() @IsString() hazopScenarioId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsString() siteId!: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() equipmentTag?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsString() ownerId!: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsIn(['Draft', 'In Preparation']) status?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() revalidationDueDate?: string;
  @IsOptional() @IsString() confidentialityLevel?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() consequence?: LopaConsequenceDto;
  @IsOptional() initiatingEvent?: LopaInitiatingEventDto;
  @IsOptional() @IsArray() importedSafeguards?: LopaImportedSafeguardDto[];
  @IsOptional() @IsArray() teamMembers?: LopaTeamMemberDto[];
  @IsOptional() @IsBoolean() sendInvitations?: boolean;
  @IsOptional() @IsString() invitationMessage?: string;
  @IsOptional() @IsDateString() invitationDueDate?: string;
}

export class SaveLopaDraftDto extends CreateLopaDto {}

export class CreateLopaFromHazopDto extends CreateLopaDto {
  @IsOptional() @IsBoolean() allowDuplicate?: boolean;
  @IsOptional() @IsString() duplicateReason?: string;
}

export class UpdateLopaDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() studyType?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() facilitatorId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() revalidationDueDate?: string;
  @IsOptional() @IsString() confidentialityLevel?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
}

export class LopaStatusReasonDto {
  @IsOptional() @IsString() reason?: string;
}

export class LopaTeamSessionsFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() discipline?: string;
  @IsOptional() @IsString() invitationStatus?: string;
  @IsOptional() @IsString() participationStatus?: string;
  @IsOptional() @IsString() sessionStatus?: string;
  @IsOptional() @IsString() sessionType?: string;
  @IsOptional() @IsString() required?: string;
  @IsOptional() @IsString() quick?: string;
}

export class UpsertLopaTeamMemberDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsString() fullName!: string;
  @IsString() email!: string;
  @IsOptional() @IsString() organization?: string;
  @IsOptional() @IsString() internalExternal?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() department?: string;
  @IsString() discipline!: string;
  @IsString() studyRole!: string;
  @IsOptional() @IsString() responsibilityDescription?: string;
  @IsOptional() @IsBoolean() requiredParticipant?: boolean;
  @IsOptional() @IsBoolean() votingParticipant?: boolean;
  @IsOptional() @IsBoolean() reviewer?: boolean;
  @IsOptional() @IsBoolean() approver?: boolean;
  @IsOptional() @IsBoolean() facilitator?: boolean;
  @IsOptional() @IsBoolean() scribe?: boolean;
  @IsOptional() @IsString() accessLevel?: string;
  @IsOptional() @IsBoolean() invitationRequired?: boolean;
  @IsOptional() @IsString() invitationStatus?: string;
  @IsOptional() @IsString() participationStatus?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reason?: string;
}

export class LopaTeamInviteDto {
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsString() declineReason?: string;
  @IsOptional() @IsBoolean() activateAccess?: boolean;
}

export class ReplaceLopaTeamMemberDto extends UpsertLopaTeamMemberDto {
  @IsString() replacedByMemberId!: string;
}

export class UpsertLopaSessionDto {
  @IsString() title!: string;
  @IsString() sessionType!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() startTime!: string;
  @IsDateString() endTime!: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() meetingLink?: string;
  @IsOptional() @IsString() facilitatorMemberId?: string;
  @IsOptional() @IsString() scribeMemberId?: string;
  @IsOptional() @IsArray() requiredAttendees?: string[];
  @IsOptional() @IsArray() optionalAttendees?: string[];
  @IsOptional() @IsString() agendaTemplate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() sendCalendarInvite?: boolean;
  @IsOptional() @IsBoolean() sendNotification?: boolean;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() reason?: string;
}

export class UpsertLopaSessionAgendaDto {
  @IsString() topic!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() relatedRecordType?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsOptional() @IsString() ownerMemberId?: string;
  @IsOptional() @IsNumber() plannedDurationMinutes?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class ReorderLopaSessionAgendaDto {
  @IsArray() itemIds!: string[];
}

export class UpsertLopaSessionAttendanceDto {
  @IsString() teamMemberId!: string;
  @IsOptional() @IsBoolean() requiredAttendee?: boolean;
  @IsString() attendanceStatus!: string;
  @IsOptional() @IsDateString() attendedFrom?: string;
  @IsOptional() @IsDateString() attendedTo?: string;
  @IsOptional() @IsString() delegateMemberId?: string;
  @IsOptional() @IsString() delegateName?: string;
  @IsOptional() @IsString() absenceReason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class BulkLopaSessionAttendanceDto {
  @IsArray() rows!: UpsertLopaSessionAttendanceDto[];
}

export class UpsertLopaSessionMinutesDto {
  @IsOptional() @IsString() minutesSummary?: string;
  @IsOptional() @IsString() discussionNotes?: string;
  @IsOptional() @IsString() keyDecisionsSummary?: string;
  @IsOptional() @IsString() assumptionsSummary?: string;
  @IsOptional() @IsString() deferredItemsSummary?: string;
  @IsOptional() @IsString() concernsSummary?: string;
  @IsOptional() @IsBoolean() followUpRequired?: boolean;
  @IsOptional() @IsString() preparedBy?: string;
  @IsOptional() @IsDateString() preparedAt?: string;
  @IsOptional() @IsString() reviewedBy?: string;
  @IsOptional() @IsDateString() reviewedAt?: string;
  @IsOptional() @IsString() reason?: string;
}

export class UpsertLopaSessionDecisionDto {
  @IsString() decisionTitle!: string;
  @IsOptional() @IsString() decisionDescription?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() relatedRecordType?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsOptional() @IsString() decisionType?: string;
  @IsOptional() @IsString() decisionOutcome?: string;
  @IsOptional() @IsString() decisionOwnerMemberId?: string;
  @IsOptional() @IsString() evidenceReference?: string;
  @IsOptional() @IsBoolean() actionRequired?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplRegistryFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() iplType?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() validationStatus?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() quick?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class UpsertLopaIplRegistryDto {
  @IsString() iplName!: string;
  @IsString() iplType!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() serviceApplication?: string;
  @IsOptional() @IsString() equipmentType?: string;
  @IsOptional() @IsString() processService?: string;
  @IsOptional() @IsString() protectedEquipment?: string;
  @IsOptional() @IsString() safeState?: string;
  @IsOptional() @IsString() demandSource?: string;
  @IsOptional() @IsString() riskReductionClaim?: string;
  @IsOptional() @IsNumber() pfdavg?: number;
  @IsOptional() @IsNumber() rrf?: number;
  @IsOptional() @IsString() pfdBasis?: string;
  @IsOptional() @IsString() rrfBasis?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sourceReference?: string;
  @IsOptional() @IsString() standardReference?: string;
  @IsOptional() @IsString() proofTestInterval?: string;
  @IsOptional() @IsString() proofTestBasis?: string;
  @IsOptional() @IsString() inspectionRequirement?: string;
  @IsOptional() @IsString() maintenanceRequirement?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() reviewDueDate?: string;
  @IsOptional() @IsString() proofTestDueDate?: string;
  @IsOptional() @IsObject() criteriaTemplate?: Record<string, unknown>;
  @IsOptional() @IsObject() typeDetails?: Record<string, unknown>;
  @IsOptional() @IsArray() requiredDocuments?: unknown[];
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() revisionNotes?: string;
}

export class LopaIplRegistryValidationItemDto {
  @IsString() criteriaKey!: string;
  @IsString() criteriaLabel!: string;
  @IsOptional() @IsBoolean() mandatory?: boolean;
  @IsString() status!: string;
  @IsOptional() @IsBoolean() evidenceRequired?: boolean;
  @IsOptional() @IsString() evidenceStatus?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class LopaIplRegistryValidationDto {
  @IsArray() items!: LopaIplRegistryValidationItemDto[];
}

export class LopaIplRegistryEquipmentLinkDto {
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() equipmentTag?: string;
  @IsOptional() @IsString() equipmentName?: string;
  @IsOptional() @IsString() equipmentType?: string;
  @IsOptional() @IsString() linkType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplRegistryDocumentLinkDto {
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @IsString() documentNumber?: string;
  @IsOptional() @IsString() documentTitle?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsString() revision?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() effectiveDate?: string;
  @IsOptional() @IsString() linkType?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplsSafeguardsFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() safeguardType?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() proposedUse?: string;
  @IsOptional() @IsString() validationStatus?: string;
  @IsOptional() @IsString() creditStatus?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() quick?: string;
}

export class UpsertLopaStudySafeguardDto {
  @IsString() safeguardName!: string;
  @IsString() safeguardType!: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() relatedScenarioId?: string;
  @IsOptional() @IsString() relatedInitiatingEventId?: string;
  @IsOptional() @IsString() relatedConsequenceId?: string;
  @IsOptional() @IsString() proposedUse?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() evidenceStatus?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpsertLopaIplCandidateDto {
  @IsOptional() @IsString() safeguardId?: string;
  @IsOptional() @IsString() registryIplId?: string;
  @IsString() iplName!: string;
  @IsString() iplType!: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() protectionFunction?: string;
  @IsOptional() @IsString() preventiveOrMitigative?: string;
  @IsOptional() @IsString() relatedInitiatingEventId?: string;
  @IsOptional() @IsString() relatedConsequenceId?: string;
  @IsOptional() @IsNumber() pfdavg?: number;
  @IsOptional() @IsNumber() rrf?: number;
  @IsOptional() @IsNumber() lowPfdavg?: number;
  @IsOptional() @IsNumber() highPfdavg?: number;
  @IsOptional() @IsNumber() lowRrf?: number;
  @IsOptional() @IsNumber() highRrf?: number;
  @IsOptional() @IsString() confidenceLevel?: string;
  @IsOptional() @IsString() pfdRrfBasis?: string;
  @IsOptional() @IsString() sourceReference?: string;
  @IsOptional() @IsString() pfdRrfMismatchJustification?: string;
  @IsOptional() @IsString() proofTestBasis?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class SelectLopaIplRegistryDto {
  @IsString() registryIplId!: string;
  @IsOptional() @IsString() protectionFunction?: string;
  @IsOptional() @IsString() preventiveOrMitigative?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplValidationCriterionDto {
  @IsString() criterionKey!: string;
  @IsString() criterionName!: string;
  @IsString() criterionCategory!: string;
  @IsOptional() @IsBoolean() requiredForCredit?: boolean;
  @IsString() status!: string;
  @IsOptional() @IsString() evidenceReference?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplValidationDto {
  @IsArray() criteria!: LopaIplValidationCriterionDto[];
}

export class LopaIplProofTestDto {
  @IsOptional() @IsBoolean() proofTestRequired?: boolean;
  @IsOptional() @IsString() proofTestInterval?: string;
  @IsOptional() @IsString() proofTestProcedureId?: string;
  @IsOptional() @IsDateString() lastProofTestDate?: string;
  @IsOptional() @IsDateString() nextProofTestDue?: string;
  @IsOptional() @IsBoolean() inspectionRequired?: boolean;
  @IsOptional() @IsString() inspectionInterval?: string;
  @IsOptional() @IsString() inspectionProcedureId?: string;
  @IsOptional() @IsString() maintenanceBasis?: string;
  @IsOptional() @IsString() miProgramId?: string;
  @IsOptional() @IsString() overdueStatus?: string;
  @IsOptional() @IsString() evidenceAttachmentId?: string;
  @IsOptional() @IsBoolean() deferralAllowed?: boolean;
  @IsOptional() @IsString() deferralApprovalStatus?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaIplCandidateActionDto {
  @IsOptional() @IsString() reason?: string;
}

export class LopaRiskCalculationFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() inputType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() quick?: string;
}

export class LopaRiskCalculationActionDto {
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpsertLopaRiskCalculationAssumptionDto {
  @IsString() assumptionType!: string;
  @IsString() assumptionTitle!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sourceReference?: string;
  @IsOptional() @IsString() relatedInputType?: string;
  @IsOptional() @IsString() relatedInputId?: string;
  @IsOptional() @IsString() impact?: string;
}

export class UpsertLopaRiskCalculationGapDto {
  @IsString() gapType!: string;
  @IsString() gapTitle!: string;
  @IsOptional() @IsString() gapDescription?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsBoolean() closureBlocker?: boolean;
  @IsOptional() @IsString() status?: string;
}

export class LopaRecommendationFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() sourceTab?: string;
  @IsOptional() @IsString() riskRelevance?: string;
  @IsOptional() blocking?: string | boolean;
  @IsOptional() overdue?: string | boolean;
  @IsOptional() @IsString() quick?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class UpsertLopaRecommendationDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() sourceType!: string;
  @IsOptional() @IsString() sourceTab?: string;
  @IsOptional() @IsString() sourceRecordId?: string;
  @IsOptional() @IsObject() sourceSnapshot?: Record<string, unknown>;
  @IsOptional() @IsString() recommendationType?: string;
  @IsString() priority!: string;
  @IsOptional() @IsString() riskRelevance?: string;
  @IsOptional() @IsBoolean() blocking?: boolean;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() responsibleDiscipline?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsBoolean() requiredBeforeReview?: boolean;
  @IsOptional() @IsBoolean() requiredBeforeStartup?: boolean;
  @IsOptional() @IsBoolean() requiredBeforeClosure?: boolean;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() verificationRequired?: boolean;
  @IsOptional() @IsString() notes?: string;
}

export class LopaRecommendationStatusDto {
  @IsString() status!: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() closureNotes?: string;
}

export class LopaRecommendationVerifyDto {
  @IsString() verificationNotes!: string;
  @IsOptional() @IsString() closureEvidenceStatus?: string;
}

export class CreateLopaActionDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsString() ownerId!: string;
  @IsString() priority!: string;
  @IsDateString() dueDate!: string;
  @IsOptional() @IsString() recommendationId?: string;
  @IsOptional() @IsString() gapId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsBoolean() blocking?: boolean;
  @IsOptional() @IsBoolean() evidenceRequired?: boolean;
  @IsOptional() @IsBoolean() verificationRequired?: boolean;
}

export class LinkExistingLopaActionDto {
  @IsString() actionId!: string;
  @IsOptional() @IsString() recommendationId?: string;
  @IsOptional() @IsString() relationshipType?: string;
  @IsOptional() @IsBoolean() blocking?: boolean;
}

export class LopaActionReasonDto {
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaLinkedRecordFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() recordType?: string;
  @IsOptional() @IsString() sourceModule?: string;
  @IsOptional() @IsString() relationshipType?: string;
  @IsOptional() required?: string | boolean;
  @IsOptional() blocking?: string | boolean;
  @IsOptional() sourceChanged?: string | boolean;
  @IsOptional() @IsString() accessStatus?: string;
  @IsOptional() @IsString() quick?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class UpsertLopaLinkedRecordDto {
  @IsString() recordType!: string;
  @IsString() sourceModule!: string;
  @IsString() sourceRecordId!: string;
  @IsOptional() @IsString() recordNumber?: string;
  @IsOptional() @IsString() recordTitle?: string;
  @IsString() relationshipType!: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() blocking?: boolean;
  @IsOptional() @IsString() sourceStatus?: string;
  @IsOptional() @IsObject() sourceSnapshot?: Record<string, unknown>;
  @IsOptional() @IsString() impactLevel?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() linkReason?: string;
}

export class LopaLibraryFilterDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

export class UpsertInitiatingEventLibraryDto {
  @IsString() eventCode!: string;
  @IsString() eventName!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() eventCategory!: string;
  @IsOptional() @IsString() failureMode?: string;
  @IsOptional() @IsString() equipmentType?: string;
  @IsOptional() @IsString() subtype?: string;
  @IsOptional() @IsString() serviceApplication?: string;
  @IsNumber() baseFrequency!: number;
  @IsString() frequencyUnit!: string;
  @IsOptional() @IsNumber() lowFrequency?: number;
  @IsOptional() @IsNumber() highFrequency?: number;
  @IsOptional() @IsString() confidenceLevel?: string;
  @IsString() sourceType!: string;
  @IsString() sourceReference!: string;
  @IsOptional() @IsString() standardReference?: string;
  @IsOptional() @IsString() applicabilityNotes?: string;
  @IsOptional() @IsString() exclusionNotes?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsBoolean() siteModifierAllowed?: boolean;
  @IsOptional() @IsNumber() defaultSiteModifier?: number;
  @IsOptional() @IsBoolean() engineeringJustificationRequired?: boolean;
  @IsOptional() @IsString() engineeringJustification?: string;
  @IsOptional() @IsString() revisionNotes?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpsertConditionalModifierLibraryDto {
  @IsString() modifierCode!: string;
  @IsString() modifierName!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() modifierType!: string;
  @IsOptional() @IsString() applicationContext?: string;
  @IsNumber() defaultValue!: number;
  @IsOptional() @IsNumber() lowValue?: number;
  @IsOptional() @IsNumber() highValue?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() confidenceLevel?: string;
  @IsString() sourceType!: string;
  @IsString() sourceReference!: string;
  @IsOptional() @IsString() standardReference?: string;
  @IsOptional() @IsString() applicabilityNotes?: string;
  @IsOptional() @IsString() exclusionNotes?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsBoolean() overrideAllowed?: boolean;
  @IsOptional() @IsBoolean() engineeringJustificationRequired?: boolean;
  @IsOptional() @IsString() engineeringJustification?: string;
  @IsOptional() @IsString() revisionNotes?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class SelectInitiatingEventLibraryDto {
  @IsString() libraryId!: string;
  @IsOptional() @IsNumber() selectedFrequency?: number;
  @IsOptional() @IsNumber() siteModifier?: number;
  @IsOptional() @IsString() engineeringJustification?: string;
  @IsOptional() @IsString() notes?: string;
}

export class SelectConditionalModifierDto {
  @IsString() libraryId!: string;
  @IsOptional() @IsNumber() selectedValue?: number;
  @IsOptional() @IsString() engineeringJustification?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateLopaScenarioConsequenceDto {
  @IsOptional() @IsString() scenarioTitle?: string;
  @IsOptional() @IsString() scenarioDescription?: string;
  @IsOptional() @IsString() scenarioSource?: string;
  @IsOptional() @IsString() operatingMode?: string;
  @IsOptional() @IsString() equipmentSystem?: string;
  @IsOptional() @IsString() equipmentTag?: string;
  @IsOptional() @IsString() scenarioBoundary?: string;
  @IsOptional() @IsString() includedEquipment?: string;
  @IsOptional() @IsString() excludedEquipment?: string;
  @IsOptional() @IsString() assumptions?: string;
  @IsOptional() @IsString() exclusions?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() reviewStatus?: string;
  @IsOptional() @IsString() deviation?: string;
  @IsOptional() @IsString() guideword?: string;
  @IsOptional() @IsString() parameter?: string;
  @IsOptional() @IsString() causeDescription?: string;
  @IsOptional() @IsString() causeCategory?: string;
  @IsOptional() @IsString() causeType?: string;
  @IsOptional() @IsString() consequenceDescription?: string;
  @IsOptional() @IsString() escalationPath?: string;
  @IsOptional() @IsString() hazardousEvent?: string;
  @IsOptional() @IsString() lossEvent?: string;
  @IsOptional() @IsString() topEvent?: string;
  @IsOptional() @IsString() safeguardsSummary?: string;
  @IsOptional() @IsString() lopaBoundaryStatement?: string;
  @IsOptional() @IsString() consequenceCategory?: string;
  @IsOptional() @IsString() consequenceSeverity?: string;
  @IsOptional() @IsString() consequenceEndpoint?: string;
  @IsOptional() @IsString() impactType?: string;
  @IsOptional() @IsString() credibleWorstCase?: string;
  @IsOptional() @IsString() mostLikelyConsequence?: string;
  @IsOptional() @IsString() consequenceBasis?: string;
  @IsOptional() @IsString() consequenceSourceReference?: string;
  @IsOptional() @IsBoolean() personnelImpact?: boolean;
  @IsOptional() @IsBoolean() environmentalImpact?: boolean;
  @IsOptional() @IsBoolean() assetImpact?: boolean;
  @IsOptional() @IsBoolean() communityImpact?: boolean;
  @IsOptional() @IsBoolean() regulatoryImpact?: boolean;
  @IsOptional() @IsNumber() tolerableEventFrequency?: number;
  @IsOptional() @IsString() riskCriteriaSource?: string;
  @IsOptional() @IsString() criteriaType?: string;
  @IsOptional() @IsString() criteriaVersion?: string;
  @IsOptional() @IsBoolean() alarpApplicable?: boolean;
  @IsOptional() @IsBoolean() riskAcceptanceRequired?: boolean;
  @IsOptional() @IsString() criteriaNotes?: string;
  @IsOptional() @IsString() criteriaApprovalStatus?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() editReason?: string;
}

export class LopaImpactedReceptorDto {
  @IsString() receptorType!: string;
  @IsOptional() @IsString() exposureLocation?: string;
  @IsOptional() @IsString() estimatedOccupancyPresence?: string;
  @IsOptional() @IsString() exposureRoute?: string;
  @IsOptional() @IsString() impactDescription?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaNoteDto {
  @IsOptional() @IsString() noteType?: string;
  @IsString() noteText!: string;
  @IsOptional() @IsString() linkedSection?: string;
  @IsOptional() @IsString() status?: string;
}

export class UpdateLopaInitiatingEventDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() eventCategory?: string;
  @IsOptional() @IsString() failureMode?: string;
  @IsOptional() @IsString() equipmentSystem?: string;
  @IsOptional() @IsString() equipmentTag?: string;
  @IsOptional() @IsString() eventBoundary?: string;
  @IsOptional() @IsString() eventTrigger?: string;
  @IsOptional() @IsString() linkedConsequenceId?: string;
  @IsOptional() @IsString() eventSource?: string;
  @IsOptional() @IsString() notes?: string;
}

export class LopaManualFrequencyDto {
  @IsNumber() frequencyPerYear!: number;
  @IsString() frequencyUnit!: string;
  @IsOptional() @IsNumber() lowEstimate?: number;
  @IsOptional() @IsNumber() highEstimate?: number;
  @IsOptional() @IsString() confidenceLevel?: string;
  @IsString() basis!: string;
  @IsString() sourceReference!: string;
  @IsString() engineeringJustification!: string;
  @IsOptional() @IsBoolean() reviewerRequired?: boolean;
  @IsOptional() @IsString() approvalStatus?: string;
}

export class LopaSiteModifierDto {
  @IsBoolean() enabled!: boolean;
  @IsNumber() modifierValue!: number;
  @IsString() modifierType!: string;
  @IsString() basis!: string;
  @IsString() engineeringJustification!: string;
  @IsString() sourceReference!: string;
  @IsOptional() @IsString() approvalStatus?: string;
}

export class UpsertLopaReviewParticipantDto {
  @IsString() userId!: string;
  @IsString() reviewRole!: string;
  @IsOptional() @IsString() discipline?: string;
  @IsOptional() @IsBoolean() requiredReviewer?: boolean;
  @IsOptional() @IsBoolean() approver?: boolean;
  @IsOptional() @IsBoolean() signatureRequired?: boolean;
  @IsOptional() @IsNumber() reviewSequence?: number;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reason?: string;
}

export class LopaReviewDecisionDto {
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comments?: string;
  @IsOptional() @IsBoolean() overrideBlockers?: boolean;
  @IsOptional() @IsBoolean() confirmed?: boolean;
}

export class UpsertLopaReviewCommentDto {
  @IsString() title!: string;
  @IsString() commentText!: string;
  @IsOptional() @IsString() commentType?: string;
  @IsOptional() @IsString() relatedTab?: string;
  @IsOptional() @IsString() relatedRecordType?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsBoolean() blocking?: boolean;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() resolutionNotes?: string;
}

export class LopaReviewCommentThreadDto {
  @IsString() message!: string;
  @IsOptional() @IsString() parentThreadId?: string;
}

export class LopaReviewSignatureDto {
  @IsString() participantId!: string;
  @IsString() signatureMeaning!: string;
  @IsString() authMethod!: 'password' | 'pin';
  @IsString() usernameReentry!: string;
  @IsString() passwordOrPin!: string;
  @IsOptional() @IsString() comment?: string;
}

export class LopaReviewReminderDto {
  @IsOptional() @IsString() participantId?: string;
  @IsOptional() @IsString() message?: string;
}

export class LopaReviewExceptionDto {
  @IsString() reason!: string;
}
