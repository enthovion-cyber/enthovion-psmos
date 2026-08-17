export const regulatorySourceTypes = [
  'Law',
  'Regulation',
  'Rule',
  'Code',
  'Standard',
  'Guideline',
  'Permit Condition',
  'License Requirement',
  'Corporate Standard',
  'Site Procedure Requirement',
  'Insurance / Loss Prevention Requirement',
  'Customer Requirement',
  'Contractual Requirement',
  'Audit Protocol',
  'PSM Requirement',
  'EHS Requirement',
  'Environmental Requirement',
  'Occupational Safety Requirement',
  'Custom'
] as const;

export const regulatoryCategories = [
  'Process Safety Management',
  'Process Safety Information',
  'Process Hazard Analysis',
  'Management of Change',
  'Pre-Startup Safety Review',
  'Operating Procedures',
  'Training',
  'Mechanical Integrity',
  'Incident Investigation',
  'Emergency Response',
  'Contractors',
  'Hot Work / PTW',
  'Environmental Compliance',
  'Air Emissions',
  'Wastewater',
  'Waste Management',
  'Hazardous Chemicals',
  'SDS / Hazard Communication',
  'Occupational Safety',
  'Fire Safety',
  'Pressure Systems',
  'Electrical / Hazardous Area',
  'Equipment Integrity',
  'Permits / Licenses',
  'Audit / Compliance Assurance',
  'Management Review',
  'Document Control',
  'Custom'
] as const;

export const regulatoryJurisdictionLevels = [
  'International',
  'Regional',
  'Country',
  'Federal / National',
  'State / Province',
  'City / Municipality',
  'Free Zone / Industrial Zone',
  'Site-Specific',
  'Corporate',
  'Custom'
] as const;

export const regulatoryCriticalityLevels = [
  'Low',
  'Medium',
  'High',
  'Critical',
  'Safety-Critical',
  'Environmental-Critical',
  'PSM-Critical',
  'Regulatory-Critical'
] as const;

export const regulatoryRegisterStatuses = [
  'Draft',
  'Active',
  'Under Review',
  'Approved Foundation',
  'Effective Soon',
  'Effective',
  'Superseded',
  'Archived',
  'Cancelled'
] as const;

export const regulatoryApplicabilityStatuses = [
  'Not Assessed',
  'Applicable',
  'Partially Applicable',
  'Not Applicable',
  'Applicability Review Required',
  'Applicability Under Review',
  'Applicability Approved Foundation',
  'Stale Applicability'
] as const;

export const regulatoryComplianceStatuses = [
  'Not Assessed',
  'Compliant Foundation',
  'Partially Compliant Foundation',
  'Non-Compliant Foundation',
  'Evidence Missing',
  'Action Required',
  'CAPA Open',
  'Review Required',
  'Not Applicable',
  'Unknown'
] as const;

export const regulatoryReviewStatuses = [
  'Not Required',
  'Review Due',
  'Review Overdue',
  'Under Review',
  'Approved Foundation',
  'Returned Foundation',
  'Rejected Foundation'
] as const;

export const regulatoryReviewFrequencies = [
  'Monthly',
  'Quarterly',
  'Semi-Annual',
  'Annual',
  'Biennial',
  'Triennial',
  'On Change',
  'Custom'
] as const;

export const regulatoryLinkModules = [
  'Audit Standards / Regulatory Mapping',
  'Audit Findings',
  'Audit CAPA',
  'Audit Evidence',
  'Action Engine',
  'Document Control',
  'PSI',
  'MOC',
  'PSSR',
  'Training',
  'Mechanical Integrity',
  'Incident',
  'PTW',
  'Reports Foundation'
] as const;

export const regulatoryAuthorityTypes = [
  'Government Regulator',
  'Environmental Authority',
  'Occupational Safety Authority',
  'Fire Authority',
  'Industrial Zone Authority',
  'Standards Body',
  'Certification Body',
  'Insurance / Loss Prevention Body',
  'Corporate Authority',
  'Site Authority',
  'Custom'
] as const;

export const regulatoryAuthorityStatuses = ['Draft', 'Active', 'Archived'] as const;

export const regulatoryApplicabilityProfileTypes = [
  'Company Applicability Profile',
  'Site Applicability Profile',
  'Unit Applicability Profile',
  'Area Applicability Profile',
  'Equipment Applicability Profile',
  'Chemical Applicability Profile',
  'Activity Applicability Profile',
  'Custom Applicability Profile'
] as const;

export const regulatoryApplicabilityProfileStatuses = ['Draft', 'Active', 'Archived'] as const;

export const regulatoryApplicabilityQuestionTypes = [
  'Yes / No',
  'Single Select',
  'Multi Select',
  'Text',
  'Number',
  'Date',
  'Evidence Required',
  'Scope Selector'
] as const;

export const regulatoryApplicabilityEffects = [
  'No Decision Effect',
  'Supports Applicable',
  'Supports Partially Applicable',
  'Supports Not Applicable',
  'Requires Review',
  'Creates Gap',
  'Requires Evidence Foundation',
  'Marks Stale'
] as const;

export const regulatoryApplicabilityAssessmentMethods = [
  'Manual Assessment',
  'Profile / Criteria Guided',
  'Jurisdiction Review',
  'Site Scope Review',
  'Regulatory Change Review',
  'Audit Finding Triggered',
  'MOC Triggered',
  'Incident Triggered',
  'Custom'
] as const;

export const regulatoryApplicabilityAssessmentStatuses = [
  'Draft',
  'In Progress',
  'Under Review',
  'Completed Foundation',
  'Returned Foundation',
  'Archived',
  'Stale Applicability'
] as const;

export const regulatoryApplicabilityGapTypes = [
  'Missing Applicability Assessment',
  'Missing Applicability Rationale',
  'Missing Scope',
  'Missing Jurisdiction',
  'Missing Authority',
  'Missing Review',
  'Missing Evidence Foundation',
  'Stale Applicability',
  'Conflicting Decision',
  'Critical Item Review Required',
  'Custom'
] as const;

export const regulatoryApplicabilityDecisions = [
  'Applicable',
  'Partially Applicable',
  'Not Applicable',
  'Applicability Review Required',
  'Applicability Under Review',
  'Not Assessed'
] as const;

export const regulatoryObligationTypes = [
  'Legal Obligation',
  'Regulatory Obligation',
  'Standard Requirement',
  'Permit Condition',
  'License Condition',
  'Corporate Requirement',
  'Site Procedure Requirement',
  'Audit Protocol Requirement',
  'Evidence Requirement',
  'Reporting Requirement',
  'Inspection Requirement',
  'Testing Requirement',
  'Training Requirement',
  'Documentation Requirement',
  'Recordkeeping Requirement',
  'Notification Requirement',
  'Review Requirement',
  'Maintenance Requirement',
  'Calibration Requirement',
  'Emergency Response Requirement',
  'PSM Element Requirement',
  'Environmental Requirement',
  'Safety Requirement',
  'Custom'
] as const;

export const regulatoryObligationCategories = [
  'Process Safety Information',
  'PHA / HAZOP',
  'LOPA / SIL',
  'Operating Procedures',
  'Training',
  'Mechanical Integrity',
  'Management of Change',
  'Pre-Startup Safety Review',
  'Incident Investigation',
  'Emergency Response',
  'Contractors',
  'Hot Work / PTW',
  'Audit / Compliance Assurance',
  'CAPA / Corrective Action',
  'Evidence / Records',
  'Environmental Monitoring',
  'Air Emissions',
  'Wastewater',
  'Waste Management',
  'Hazard Communication / SDS',
  'Chemical Inventory',
  'Pressure Systems',
  'Fire Safety',
  'Electrical Classification',
  'Document Control',
  'Management Review',
  'Custom'
] as const;

export const regulatoryObligationFrequencies = [
  'One-Time',
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  'Semi-Annual',
  'Annual',
  'Biennial',
  'Triennial',
  'Every 5 Years',
  'On Change',
  'Before Startup',
  'Before Work',
  'After Incident',
  'After MOC',
  'After Audit',
  'Permit Renewal Cycle',
  'Custom'
] as const;

export const regulatoryObligationTriggerEvents = [
  'On Change',
  'Before Startup',
  'Before Work',
  'After Incident',
  'After MOC',
  'After PSSR',
  'After Audit',
  'On Permit Renewal',
  'On Equipment Change',
  'On Chemical Change',
  'On Procedure Change',
  'Custom'
] as const;

export const regulatoryObligationStatuses = [
  'Draft',
  'Active',
  'Under Review',
  'Approved Foundation',
  'Effective Soon',
  'Effective',
  'Due Soon',
  'Overdue',
  'Superseded',
  'Archived',
  'Cancelled'
] as const;

export const regulatoryObligationApplicabilityStatuses = [
  'Inherited From Parent',
  'Not Assessed',
  'Applicable',
  'Partially Applicable',
  'Not Applicable',
  'Applicability Review Required',
  'Applicability Under Review',
  'Stale Applicability'
] as const;

export const regulatoryEvidenceExpectationStatuses = [
  'No Evidence Required',
  'Evidence Required',
  'Evidence Expectation Missing',
  'Evidence Linked Foundation',
  'Evidence Missing Foundation',
  'Evidence Under Review Foundation'
] as const;

export const regulatoryModuleMappingStatuses = [
  'Not Mapped',
  'Mapped To Module',
  'Mapped To Record Foundation',
  'Mapping Required',
  'Mapping Stale'
] as const;

export const regulatoryObligationStaleStatuses = [
  'Current',
  'Parent Requirement Changed',
  'Applicability Changed',
  'Jurisdiction Changed',
  'Scope Changed',
  'Owner Changed',
  'Evidence Expectation Changed',
  'Module Mapping Changed',
  'Compliance Status Changed',
  'Review Overdue',
  'Superseded',
  'Reassessment Required'
] as const;

export const regulatoryObligationGapTypes = [
  'Missing Obligation Breakdown',
  'Missing Owner',
  'Missing Scope',
  'Missing Applicability Rationale',
  'Missing Evidence Expectation',
  'Missing Frequency',
  'Missing Due Date',
  'Missing Module Mapping',
  'Missing Review Date',
  'Compliance Status Not Assessed',
  'Critical Obligation Missing Risk Basis',
  'PSM-Critical Obligation Missing Module Mapping',
  'Overdue Obligation',
  'Stale Obligation',
  'Parent Requirement Superseded',
  'Evidence Required Foundation',
  'Action Required Foundation',
  'Custom'
] as const;

export const regulatoryComplianceAssessmentStatuses = [
  'Draft',
  'In Progress',
  'Completed',
  'Submitted For Review Foundation',
  'Review Required',
  'Archived',
  'Stale',
  'Superseded'
] as const;

export const regulatoryComplianceEvidenceReadinessStatuses = [
  'Not Assessed',
  'Evidence Not Required',
  'Evidence Expected',
  'Evidence Ready Foundation',
  'Evidence Missing',
  'Evidence Restricted',
  'Evidence Under Review Foundation',
  'Stale Evidence'
] as const;

export const regulatoryComplianceCriteriaStatuses = [
  'Not Checked',
  'Pass Foundation',
  'Partial Foundation',
  'Fail Foundation',
  'Not Applicable',
  'Evidence Missing',
  'Action Required',
  'Review Required'
] as const;

export const regulatoryComplianceGapTypes = [
  'Missing Compliance Assessment',
  'Missing Evidence',
  'Missing Owner',
  'Missing Applicability',
  'Missing Obligation Breakdown',
  'Missing Module Mapping',
  'Open Audit Finding',
  'Open CAPA',
  'Open Action',
  'Overdue Obligation',
  'Review Overdue',
  'Stale Compliance Status',
  'Stale Applicability',
  'Stale Evidence',
  'Critical Requirement Non-Compliant',
  'PSM-Critical Gap',
  'Safety-Critical Gap',
  'Environmental-Critical Gap',
  'Regulatory-Critical Gap',
  'Manual Gap',
  'Custom'
] as const;

export const regulatoryComplianceGapStatuses = [
  'Open',
  'In Progress',
  'Action Foundation Created',
  'CAPA Open',
  'Accepted Risk Foundation',
  'Waived Foundation',
  'Resolved',
  'Archived',
  'Overdue'
] as const;

export const regulatoryComplianceGapSeverities = [
  'Low',
  'Medium',
  'High',
  'Critical',
  'Immediate Action Required'
] as const;

export const regulatoryComplianceStaleStatuses = [
  'Current',
  'Source Changed',
  'Obligation Changed',
  'Applicability Changed',
  'Scope Changed',
  'Jurisdiction Changed',
  'Evidence Changed',
  'Action Changed',
  'Audit Finding Changed',
  'Review Changed',
  'Review Overdue',
  'Source Superseded',
  'Manual Declaration Expired',
  'Reassessment Required'
] as const;

export const regulatoryComplianceSourceTypes = [
  'Regulatory Item',
  'Obligation',
  'Applicability Assessment',
  'Audit Finding Foundation',
  'Evidence Foundation',
  'Action Foundation'
] as const;

export const regulatoryEvidenceSourceTypes = [
  'Regulatory Item',
  'Regulatory Obligation',
  'Compliance Assessment',
  'Compliance Gap',
  'Applicability Assessment',
  'Audit Mapping Foundation',
  'Manual Requirement'
] as const;

export const regulatoryEvidenceTypes = [
  'Controlled Document',
  'Policy',
  'Procedure',
  'SOP',
  'Permit',
  'License',
  'Inspection Record',
  'Test Record',
  'Calibration Record',
  'Maintenance Record',
  'Training Record',
  'Audit Evidence',
  'CAPA Evidence',
  'MOC Record',
  'PSSR Record',
  'PSI Record',
  'PTW Record',
  'Incident Record',
  'SDS / Chemical Record Foundation',
  'Monitoring Record',
  'Report',
  'Photo / Screenshot',
  'External Reference Foundation',
  'Custom'
] as const;

export const regulatoryEvidenceRequirementStatuses = [
  'Draft',
  'Active',
  'Evidence Required',
  'Evidence Linked',
  'Evidence Missing',
  'Pending Review',
  'Verified Foundation',
  'Rejected',
  'Rework Required',
  'Waived Foundation',
  'Archived'
] as const;

export const regulatoryEvidenceStatuses = [
  'Draft',
  'Linked',
  'Pending Review',
  'Verified Foundation',
  'Rejected',
  'Rework Required',
  'Restricted',
  'Stale',
  'Expired',
  'Superseded',
  'Missing Source',
  'Archived'
] as const;

export const regulatoryEvidenceReviewStatuses = [
  'Not Submitted',
  'Pending Review',
  'Verified Foundation',
  'Rejected',
  'Rework Required',
  'Waived Foundation',
  'Review Overdue'
] as const;

export const regulatoryEvidenceReadinessStatuses = [
  'Ready For Review',
  'Evidence Linked',
  'Evidence Missing',
  'Evidence Invalid',
  'Evidence Restricted',
  'Evidence Expired',
  'Evidence Stale',
  'Permission Missing',
  'Source Invalid'
] as const;

export const regulatoryEvidenceSourceModules = [
  'Document Control',
  'Storage',
  'Audit Evidence',
  'Audit Mapping Foundation',
  'PSI',
  'MOC',
  'PSSR',
  'Training',
  'Mechanical Integrity',
  'Incident',
  'PTW',
  'Action Engine',
  'CAPA',
  'External Reference Foundation',
  'Manual Placeholder Foundation'
] as const;

export const regulatoryEvidenceGapTypes = [
  'Missing Evidence Requirement',
  'Missing Evidence',
  'Evidence Pending Review',
  'Evidence Rejected',
  'Evidence Rework Required',
  'Evidence Expired',
  'Evidence Superseded',
  'Evidence Stale',
  'Evidence Restricted Access Issue',
  'Evidence Source Missing',
  'Evidence Version Outdated',
  'Evidence Owner Missing',
  'Evidence Reviewer Missing',
  'Evidence Package Incomplete',
  'Critical Evidence Missing',
  'PSM-Critical Evidence Missing',
  'Environmental-Critical Evidence Missing',
  'Regulatory-Critical Evidence Missing',
  'Manual Gap',
  'Custom'
] as const;

export const regulatoryEvidencePackageTypes = [
  'Regulatory Item Evidence Package',
  'Obligation Evidence Package',
  'Compliance Assessment Evidence Package',
  'Gap Closure Evidence Package',
  'Audit Mapping Evidence Package',
  'External Auditor Package Foundation',
  'Regulator Package Foundation',
  'Management Review Package Foundation'
] as const;

export const regulatoryEvidencePackageStatuses = [
  'Draft',
  'Preparing',
  'Prepared',
  'Partially Prepared',
  'Missing Evidence',
  'Pending Review',
  'Approved Foundation',
  'Export Ready Foundation',
  'Exported Foundation',
  'Stale',
  'Archived'
] as const;

export const regulatoryEvidenceConfidentialityLevels = [
  'Public Internal',
  'Internal',
  'Restricted',
  'Confidential',
  'Legal Sensitive',
  'External Auditor Only Foundation',
  'Regulator Only Foundation'
] as const;

export const regulatoryEvidenceStaleStatuses = [
  'Current',
  'Source Changed',
  'Requirement Changed',
  'Document Version Changed',
  'Document Superseded',
  'Module Record Changed',
  'Audit Evidence Changed',
  'Evidence Expired',
  'Review Overdue',
  'Package Source Changed',
  'Access Changed',
  'Superseded',
  'Needs Replacement'
] as const;

export const regulatoryAuditMappingTypes = [
  'Direct Verification',
  'Indirect Verification',
  'Evidence Support',
  'Checklist Coverage',
  'Finding Link',
  'CAPA Link',
  'Score Link',
  'Audit Standard Clause Link',
  'Program Coverage',
  'Plan Coverage',
  'Execution Result',
  'Historical Mapping',
  'Manual Foundation Mapping',
  'Other'
] as const;

export const regulatoryAuditMappingSourceTypes = [
  'Regulatory Item',
  'Regulatory Obligation',
  'Compliance Assessment',
  'Compliance Gap',
  'Evidence Link',
  'Evidence Package',
  'Site Scope',
  'Unit Scope',
  'Area Scope',
  'Equipment Scope',
  'Manual Foundation'
] as const;

export const regulatoryAuditTargetTypes = [
  'Audit Standards Mapping',
  'Audit Program',
  'Audit Plan',
  'Audit Checklist',
  'Audit Checklist Section',
  'Audit Checklist Item',
  'Audit Execution',
  'Audit Execution Response',
  'Audit Field Finding',
  'Audit Finding',
  'Audit CAPA',
  'Audit CAPA Action',
  'Audit Evidence',
  'Audit Score Run',
  'Audit Score Component',
  'Audit Review Package',
  'Audit Report',
  'Foundation Placeholder'
] as const;

export const regulatoryAuditMappingStatuses = [
  'Draft',
  'Active',
  'Pending Review',
  'Verified',
  'Rejected',
  'Rework Required',
  'Stale',
  'Archived',
  'Superseded',
  'Locked'
] as const;

export const regulatoryAuditCoverageStatuses = [
  'Not Mapped',
  'Mapped',
  'Partially Covered',
  'Covered',
  'Coverage Gap',
  'Missing Checklist',
  'Missing Evidence',
  'Missing Finding Link',
  'Missing CAPA Link',
  'Missing Score Link',
  'Ready For Audit',
  'Not Ready For Audit',
  'Override Accepted',
  'Not Applicable'
] as const;

export const regulatoryAuditVerificationStatuses = [
  'Not Submitted',
  'Pending Review',
  'Verified',
  'Rejected',
  'Rework Required',
  'Verification Blocked',
  'Historical Verification',
  'Override Accepted'
] as const;

export const regulatoryAuditMappingGapTypes = [
  'Missing Audit Mapping',
  'Missing Checklist',
  'Missing Evidence',
  'Missing Finding Link',
  'Missing CAPA Link',
  'Missing Score Link',
  'Stale Mapping',
  'Restricted Audit Evidence',
  'Incomplete Coverage',
  'Unverified Mapping',
  'Audit Target Not Accessible',
  'Other'
] as const;

export const regulatoryAuditMappingStaleStatuses = [
  'Current',
  'Stale',
  'Potentially Stale',
  'Recalculation Required',
  'Superseded',
  'Needs Review'
] as const;

export const regulatoryActionSourceTypes = [
  'Regulatory Item',
  'Obligation',
  'Applicability Gap',
  'Obligation Gap',
  'Compliance Gap',
  'Evidence Gap',
  'Audit Mapping Gap',
  'Compliance Assessment',
  'Evidence Link',
  'Audit Mapping',
  'Audit CAPA Link',
  'Manual Regulatory Action Source'
] as const;

export const regulatoryActionTypes = [
  'Corrective Action',
  'Preventive Action',
  'Systemic Action',
  'Evidence Collection Action',
  'Evidence Rework Action',
  'Applicability Review Action',
  'Obligation Breakdown Action',
  'Compliance Reassessment Action',
  'Audit Mapping Action',
  'Procedure Action',
  'Training Action',
  'MOC Action',
  'PSSR Action',
  'Mechanical Integrity Action',
  'PTW / Permit Control Action',
  'Document Control Action',
  'Engineering Control Action',
  'Administrative Control Action',
  'Management Review Action'
] as const;

export const regulatoryActionModes = [
  'Create New Universal Action',
  'Link Existing Universal Action',
  'Link Existing Audit CAPA',
  'Create Regulatory CAPA Package Foundation',
  'Manual Action Placeholder Foundation'
] as const;

export const regulatoryActionPriorities = [
  'Low',
  'Medium',
  'High',
  'Critical',
  'Safety-Critical',
  'Environmental-Critical',
  'PSM-Critical',
  'Regulatory-Critical'
] as const;

export const regulatoryActionStatuses = [
  'Action Not Started',
  'Action In Progress',
  'Action Overdue',
  'Action Pending Verification',
  'Action Completed',
  'Action Verified',
  'Action Verification Failed',
  'Action Effectiveness Pending',
  'Action Ineffective',
  'Action Missing',
  'Action Archived',
  'Action Reopened',
  'Action Cancelled'
] as const;

export const regulatoryActionSyncStatuses = [
  'Not Synced',
  'Synced',
  'Sync Pending',
  'Sync Failed',
  'Stale Sync',
  'Action Engine Unavailable',
  'Audit CAPA Unavailable'
] as const;

export const regulatoryActionClosureReadinessStatuses = [
  'Not Ready',
  'Ready for Gap Closure',
  'Blocking Compliance',
  'Ready with Waiver',
  'Waiver Required',
  'Stale Sync Blocks Closure',
  'Evidence Required',
  'Verification Required',
  'Effectiveness Required',
  'Not Required'
] as const;

export const regulatoryActionVerificationStatuses = [
  'Not Required',
  'Required',
  'Pending Verification',
  'Verification Passed',
  'Verification Failed',
  'Recheck Required'
] as const;

export const regulatoryActionEffectivenessStatuses = [
  'Not Required',
  'Required',
  'Effectiveness Pending',
  'Effectiveness Passed',
  'Effectiveness Failed',
  'Recheck Required'
] as const;

export const regulatoryCapaPackageTypes = [
  'Regulatory Compliance CAPA',
  'Evidence Gap CAPA',
  'Audit Mapping CAPA',
  'Applicability CAPA',
  'Obligation Breakdown CAPA',
  'PSM-Critical Regulatory CAPA',
  'Environmental Regulatory CAPA',
  'Safety Regulatory CAPA'
] as const;

export const regulatoryCapaPackageStatuses = [
  'Draft',
  'Open',
  'In Progress',
  'Pending Verification',
  'Ready for Closure',
  'Closed Foundation',
  'Reopened',
  'Archived'
] as const;

export const regulatoryPermissions = [
  'regulatory.view',
  'regulatory.dashboard.view',
  'regulatory.register.view',
  'regulatory.item.view',
  'regulatory.item.create',
  'regulatory.item.edit',
  'regulatory.item.archive',
  'regulatory.item.reactivate',
  'regulatory.item.lock',
  'regulatory.item.unlock',
  'regulatory.item.assign_owner',
  'regulatory.item.change_status',
  'regulatory.item.change_applicability',
  'regulatory.item.change_compliance_status',
  'regulatory.jurisdiction.view',
  'regulatory.jurisdiction.dashboard.view',
  'regulatory.jurisdiction.create',
  'regulatory.jurisdiction.edit',
  'regulatory.jurisdiction.archive',
  'regulatory.jurisdiction.reactivate',
  'regulatory.authority.view',
  'regulatory.authority.create',
  'regulatory.authority.edit',
  'regulatory.authority.archive',
  'regulatory.authority.link',
  'regulatory.applicability.view',
  'regulatory.applicability.dashboard.view',
  'regulatory.applicability.matrix.view',
  'regulatory.applicability.assessment.create',
  'regulatory.applicability.assessment.edit',
  'regulatory.applicability.assessment.submit',
  'regulatory.applicability.assessment.archive',
  'regulatory.applicability.decision.make',
  'regulatory.applicability.decision.review',
  'regulatory.applicability.decision.override',
  'regulatory.applicability.profile.view',
  'regulatory.applicability.profile.create',
  'regulatory.applicability.profile.edit',
  'regulatory.applicability.profile.archive',
  'regulatory.applicability.criteria.manage',
  'regulatory.applicability.gap.view',
  'regulatory.applicability.gap.manage',
  'regulatory.applicability.stale.view',
  'regulatory.applicability.history.view',
  'regulatory.applicability.settings.edit',
  'regulatory.obligation.view',
  'regulatory.obligation.dashboard.view',
  'regulatory.obligation.register.view',
  'regulatory.obligation.matrix.view',
  'regulatory.obligation.create',
  'regulatory.obligation.edit',
  'regulatory.obligation.archive',
  'regulatory.obligation.reactivate',
  'regulatory.obligation.lock',
  'regulatory.obligation.unlock',
  'regulatory.obligation.assign_owner',
  'regulatory.obligation.change_status',
  'regulatory.obligation.change_applicability',
  'regulatory.obligation.change_compliance_status',
  'regulatory.obligation.scope.view',
  'regulatory.obligation.scope.manage',
  'regulatory.obligation.evidence_expectation.view',
  'regulatory.obligation.evidence_expectation.manage',
  'regulatory.obligation.module_mapping.view',
  'regulatory.obligation.module_mapping.manage',
  'regulatory.obligation.link.view',
  'regulatory.obligation.link.manage',
  'regulatory.obligation.gap.view',
  'regulatory.obligation.gap.manage',
  'regulatory.obligation.stale.view',
  'regulatory.obligation.history.view',
  'regulatory.obligation.settings.edit',
  'regulatory.compliance.view',
  'regulatory.compliance.dashboard.view',
  'regulatory.compliance.register.view',
  'regulatory.compliance.matrix.view',
  'regulatory.compliance.assessment.view',
  'regulatory.compliance.assessment.create',
  'regulatory.compliance.assessment.edit',
  'regulatory.compliance.assessment.complete',
  'regulatory.compliance.assessment.archive',
  'regulatory.compliance.status.change',
  'regulatory.compliance.status.manual_declare',
  'regulatory.compliance.status.override',
  'regulatory.compliance.rollup.view',
  'regulatory.compliance.rollup.recalculate',
  'regulatory.compliance.evidence_readiness.view',
  'regulatory.compliance.evidence_readiness.manage',
  'regulatory.compliance.criteria.view',
  'regulatory.compliance.criteria.manage',
  'regulatory.compliance.gap.view',
  'regulatory.compliance.gap.create',
  'regulatory.compliance.gap.edit',
  'regulatory.compliance.gap.resolve',
  'regulatory.compliance.gap.archive',
  'regulatory.compliance.gap.create_action_foundation',
  'regulatory.compliance.stale.view',
  'regulatory.compliance.stale.reassess',
  'regulatory.compliance.history.view',
  'regulatory.compliance.settings.edit',
  'regulatory.evidence.view',
  'regulatory.evidence.dashboard.view',
  'regulatory.evidence.register.view',
  'regulatory.evidence.requirement.view',
  'regulatory.evidence.requirement.create',
  'regulatory.evidence.requirement.edit',
  'regulatory.evidence.requirement.archive',
  'regulatory.evidence.link.view',
  'regulatory.evidence.link.create',
  'regulatory.evidence.link.edit',
  'regulatory.evidence.link.remove',
  'regulatory.evidence.link.replace',
  'regulatory.evidence.link.archive',
  'regulatory.evidence.upload',
  'regulatory.evidence.link_document',
  'regulatory.evidence.link_module_record',
  'regulatory.evidence.preview',
  'regulatory.evidence.download',
  'regulatory.evidence.restricted.view',
  'regulatory.evidence.restricted.manage',
  'regulatory.evidence.review.view',
  'regulatory.evidence.review.submit',
  'regulatory.evidence.review.verify',
  'regulatory.evidence.review.reject',
  'regulatory.evidence.review.request_rework',
  'regulatory.evidence.request.view',
  'regulatory.evidence.request.create',
  'regulatory.evidence.request.fulfill',
  'regulatory.evidence.request.cancel',
  'regulatory.evidence.gap.view',
  'regulatory.evidence.gap.create',
  'regulatory.evidence.gap.edit',
  'regulatory.evidence.gap.resolve',
  'regulatory.evidence.gap.create_action_foundation',
  'regulatory.evidence.package.view',
  'regulatory.evidence.package.prepare',
  'regulatory.evidence.package.include_restricted',
  'regulatory.evidence.chain.view',
  'regulatory.evidence.access_log.view',
  'regulatory.evidence.stale.view',
  'regulatory.evidence.history.view',
  'regulatory.evidence.settings.edit',
  'regulatory.scope.view',
  'regulatory.scope.manage',
  'regulatory.link.view',
  'regulatory.link.manage',
  'regulatory.audit_mapping.view',
  'regulatory.audit_mapping.dashboard.view',
  'regulatory.audit_mapping.register.view',
  'regulatory.audit_mapping.matrix.view',
  'regulatory.audit_mapping.traceability.view',
  'regulatory.audit_mapping.create',
  'regulatory.audit_mapping.edit',
  'regulatory.audit_mapping.archive',
  'regulatory.audit_mapping.verify',
  'regulatory.audit_mapping.reject',
  'regulatory.audit_mapping.recalculate',
  'regulatory.audit_mapping.mark_stale',
  'regulatory.audit_mapping.refresh_snapshot',
  'regulatory.audit_mapping.link',
  'regulatory.audit_mapping.link_audit_program',
  'regulatory.audit_mapping.link_audit_plan',
  'regulatory.audit_mapping.link_checklist',
  'regulatory.audit_mapping.link_execution',
  'regulatory.audit_mapping.link_finding',
  'regulatory.audit_mapping.link_capa',
  'regulatory.audit_mapping.link_evidence',
  'regulatory.audit_mapping.link_score',
  'regulatory.audit_mapping.coverage.view',
  'regulatory.audit_mapping.coverage.recalculate',
  'regulatory.audit_mapping.gap.view',
  'regulatory.audit_mapping.gap.create',
  'regulatory.audit_mapping.gap.edit',
  'regulatory.audit_mapping.gap.resolve',
  'regulatory.audit_mapping.gap.create_action_foundation',
  'regulatory.audit_mapping.review.view',
  'regulatory.audit_mapping.review.submit',
  'regulatory.audit_mapping.history.view',
  'regulatory.audit_mapping.settings.edit',
  'regulatory.action.view',
  'regulatory.action.link',
  'regulatory.action.dashboard.view',
  'regulatory.action.register.view',
  'regulatory.action.create',
  'regulatory.action.link_existing',
  'regulatory.action.link_audit_capa',
  'regulatory.action.edit_link',
  'regulatory.action.archive_link',
  'regulatory.action.sync',
  'regulatory.action.refresh_snapshot',
  'regulatory.action.escalate',
  'regulatory.action.open_universal_action',
  'regulatory.action.closure_readiness.view',
  'regulatory.action.closure_readiness.check',
  'regulatory.action.verification.view',
  'regulatory.action.verification.submit',
  'regulatory.action.verification.fail',
  'regulatory.action.effectiveness.view',
  'regulatory.action.effectiveness.submit',
  'regulatory.capa.view',
  'regulatory.capa.create',
  'regulatory.capa.edit',
  'regulatory.capa.archive',
  'regulatory.capa.add_source',
  'regulatory.capa.add_action',
  'regulatory.capa.close_foundation',
  'regulatory.capa.reopen',
  'regulatory.action.sync_log.view',
  'regulatory.action.history.view',
  'regulatory.action.settings.edit',
  'regulatory.review.view',
  'regulatory.review.submit',
  'regulatory.report.view',
  'regulatory.history.view',
  'regulatory.settings.view',
  'regulatory.settings.edit'
] as const;
