// apps/api/src/contractor-safety/contractor-safety.constants.ts

export const CSM_TIERS = [
  { value: 'TIER_1', label: 'Tier 1 - High Risk (Process Turnaround, Hot Work, Line Breaking)', description: 'Contractors working directly on or adjacent to process units handling covered hazardous chemicals.' },
  { value: 'TIER_2', label: 'Tier 2 - Medium Risk (Facilities, Fabrication, Insulation)', description: 'Contractors executing general industrial maintenance outside active process containment boundaries.' },
  { value: 'TIER_3', label: 'Tier 3 - Low Risk (Non-Process, Delivery, Environmental Testing)', description: 'Contractors performing non-intrusive operations, deliveries, consulting, or administrative services.' }
] as const;

export const CSM_STATUSES = [
  { value: 'PENDING_PREQUAL', label: 'Pending Prequalification', color: 'amber' },
  { value: 'ACTIVE', label: 'Active & Approved', color: 'emerald' },
  { value: 'CONDITIONAL', label: 'Conditional Approval (Variance Active)', color: 'orange' },
  { value: 'SUSPENDED', label: 'Suspended (Safety Hold)', color: 'rose' },
  { value: 'DISQUALIFIED', label: 'Disqualified / Rejected', color: 'slate' },
  { value: 'INACTIVE', label: 'Inactive / Dormant', color: 'zinc' }
] as const;

export const CSM_GRADES = [
  { value: 'A', label: 'Grade A - Preferred Partner (>90%)', color: 'emerald' },
  { value: 'B', label: 'Grade B - Approved Contractor (80-89%)', color: 'blue' },
  { value: 'C', label: 'Grade C - Conditional / Monitored (70-79%)', color: 'amber' },
  { value: 'D', label: 'Grade D - High Risk / Review Needed (60-69%)', color: 'orange' },
  { value: 'F', label: 'Grade F - Disqualified (<60%)', color: 'rose' },
  { value: 'UNRATED', label: 'Unrated / New', color: 'slate' }
] as const;

export const CSM_SPECIALTIES = [
  'Welding & Pipefitting',
  'Pressure Vessel Repair',
  'Hot Tap Operations',
  'Valve Overhaul',
  'Scaffolding',
  'Fall Protection Systems',
  'Rigging & Heavy Lift',
  'Confined Space Rescue Standby',
  'Electrical & Instrumentation',
  'Class 1 Div 1 Hazardous Wiring',
  'Analyzer Maintenance',
  'PLC/DCS Loops',
  'Hydroblasting & Tank Cleaning',
  'Chemical Cleaning',
  'Waste Management & Neutralization',
  'Insulation & Lagging',
  'Cryogenic Jacketing',
  'Civil & Concrete',
  'Painting & Coating',
  'Catalyst Handling'
] as const;

export const CSM_DOCUMENT_TYPES = [
  { value: 'COI_GENERAL_LIABILITY', label: 'Certificate of Insurance - General Liability', requiredFor: ['TIER_1', 'TIER_2', 'TIER_3'] },
  { value: 'COI_WORKERS_COMP', label: 'Certificate of Insurance - Workers Compensation', requiredFor: ['TIER_1', 'TIER_2', 'TIER_3'] },
  { value: 'COI_AUTO', label: 'Certificate of Insurance - Commercial Auto Liability', requiredFor: ['TIER_1', 'TIER_2'] },
  { value: 'COI_UMBRELLA', label: 'Certificate of Insurance - Umbrella / Excess Liability', requiredFor: ['TIER_1'] },
  { value: 'OSHA_300', label: 'OSHA Form 300 Log of Work-Related Injuries & Illnesses', requiredFor: ['TIER_1', 'TIER_2'] },
  { value: 'OSHA_300A', label: 'OSHA Form 300A Annual Summary (Signed)', requiredFor: ['TIER_1', 'TIER_2'] },
  { value: 'SAFETY_PROGRAM_MANUAL', label: 'Written Safety Program / HSE Manual', requiredFor: ['TIER_1', 'TIER_2'] },
  { value: 'EMR_RATING_LETTER', label: 'Experience Modification Rate (EMR) Insurance Letter', requiredFor: ['TIER_1', 'TIER_2'] },
  { value: 'HAZCOM_WRITTEN_PLAN', label: 'Hazard Communication (HazCom) Written Plan', requiredFor: ['TIER_1'] },
  { value: 'OTHER', label: 'Other Regulatory / Safety Compliance Document', requiredFor: [] }
] as const;
