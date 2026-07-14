import {
  Bell,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Fingerprint,
  GitBranch,
  HardHat,
  Hospital,
  Layers3,
  LockKeyhole,
  Map,
  RadioTower,
  ScrollText,
  ShieldCheck,
  Siren,
  Sparkles,
  UsersRound,
  Wrench
} from 'lucide-react';
import type { MarketingModule } from '../types/marketing.types';

export const modules: MarketingModule[] = [
  { title: 'MOC', description: 'Change lifecycle, risk review, approvals, implementation actions, PSSR triggers, and closure evidence.', status: 'Core workflow', icon: GitBranch, href: '/features#moc' },
  { title: 'PSSR', description: 'Startup readiness, checklist verification, blockers, signatures, and startup authorization records.', status: 'Readiness control', icon: ClipboardCheck, href: '/features#pssr' },
  { title: 'HAZOP/PHA', description: 'Nodes, deviations, safeguards, recommendations, risk ranking, sessions, signoff, and reports.', status: 'Study governance', icon: FileSearch, href: '/features#hazop' },
  { title: 'LOPA/SIL', description: 'IPL validation, risk calculation, SIL determination, SIF basis, attachments, history, and exports.', status: 'Risk analysis', icon: ShieldCheck, href: '/features#lopa' },
  { title: 'Incident Investigation', description: 'Near miss, accident, RCA, barriers, CAPA, regulatory reporting, lessons, and final report.', status: 'Investigation OS', icon: Siren, href: '/features#incidents' },
  { title: 'Mechanical Integrity', description: 'Inspection, proof-test, maintenance evidence, equipment status, and follow-up requirements.', status: 'Asset assurance', icon: Wrench, href: '/features#mi' },
  { title: 'PTW / Control of Work', description: 'Permits, isolations, gas testing, SIMOPS, handover, signatures, and field execution.', status: 'Live control', icon: HardHat, href: '/features#ptw' },
  { title: 'Document Control', description: 'Controlled documents, revisions, secure files, evidence links, and audit-ready records.', status: 'Controlled evidence', icon: FileText, href: '/features#documents' },
  { title: 'Training', description: 'Training readiness, assigned learning, role-based requirements, and workforce qualification evidence.', status: 'Workforce ready', icon: UsersRound, href: '/features#training' },
  { title: 'Audit & Reports', description: 'Immutable history, audit metadata, approval timelines, exports, and executive reporting.', status: 'Audit ready', icon: BookOpenCheck, href: '/features#audit' }
];

export const featureCards = [
  { title: 'Unified PSM Workspace', text: 'Company, site, unit, area, module, document, action, and approval data in one operating layer.', icon: Building2 },
  { title: 'Role-based Access', text: 'Employees, contractors, viewers, site leaders, and admins see only the records their role and scope allow.', icon: LockKeyhole },
  { title: 'Multi-site Operations', text: 'Designed for industrial organizations managing several plants, units, areas, and operating teams.', icon: Map },
  { title: 'Centralized Dashboard', text: 'Safety leaders can see blocked work, overdue actions, open studies, incidents, and readiness signals.', icon: Layers3 }
];

export const aiFeatures = [
  'AI-assisted SDS and compliance review',
  'Engineering calculators and structured checks',
  'Chemical database and hazard lookup support',
  'Risk insight and action recommendation drafts',
  'Report generation support with human review required'
];

export const workflowSteps = [
  'Create your workspace',
  'Add sites, units, and areas',
  'Invite your team',
  'Configure modules and permissions',
  'Start MOC / PSSR / HAZOP / LOPA / Incident workflows',
  'Track actions and evidence',
  'Review, approve, sign, and export reports'
];

export const securityItems = [
  { title: 'Company/site isolation', text: 'Workspace and site boundaries are enforced through backend authorization.', icon: Building2 },
  { title: 'Role-based permissions', text: 'Permission-aware navigation, menus, APIs, and guarded actions.', icon: Fingerprint },
  { title: 'Audit history', text: 'Safety-critical create, update, approval, upload, and export actions are traceable.', icon: ScrollText },
  { title: 'Secure file storage', text: 'Evidence and controlled documents use secure storage and document control patterns.', icon: FileText },
  { title: 'E-signature readiness', text: 'Review and approval flows are designed for e-signature integration.', icon: CheckCircle2 },
  { title: 'Data retention controls', text: 'Administrative controls support lifecycle governance and audit preservation.', icon: ShieldCheck }
];

export const teamRoles = ['HSE Manager', 'Process Safety Engineer', 'Operations Manager', 'Maintenance Manager', 'Plant Manager', 'Contractors', 'Auditors'];

export const faqItems = [
  ['Is a credit card required for the 14-day trial?', 'No. The 14-day trial does not require a credit card.'],
  ['Can I use Google to sign up?', 'Yes. You can sign up with Google OAuth or email/password.'],
  ['What happens after I click Buy Plan?', 'If you are not signed in, you will create an account first. Then you will create your workspace and continue to the selected plan checkout.'],
  ['Can one company have multiple sites?', 'Yes. Enthovion PSM OS is built for multi-company and multi-site operations.'],
  ['Can contractors have limited access?', 'Yes. Contractors can be restricted to assigned records, actions, permits, or training.'],
  ['Is data separated between companies?', 'Yes. Each company workspace is isolated using company/site scoping and backend authorization.'],
  ['Can I upgrade later?', 'Yes. Billing admins can upgrade or manage plans from workspace billing settings.'],
  ['Does AI replace engineering review?', 'No. AI features are decision-support tools. Final review stays with qualified users.']
];

export const visualSignals = [
  { label: 'Company', value: 'Workspace', icon: Building2 },
  { label: 'Site', value: 'Plant', icon: RadioTower },
  { label: 'Module', value: 'Workflow', icon: BrainCircuit },
  { label: 'Evidence', value: 'Audit-ready', icon: Sparkles },
  { label: 'Review', value: 'Human-owned', icon: Hospital },
  { label: 'Action', value: 'Verified', icon: CheckCircle2 },
  { label: 'Notify', value: 'Escalate', icon: Bell }
];
