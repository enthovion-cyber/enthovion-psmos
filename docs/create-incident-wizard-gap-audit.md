# Create Incident Wizard PDF Gap Audit

Source PDF: `C:\Users\Jibrael Khan\Downloads\Create Incident Wizard Specification.pdf`

Scope verified: `/incidents/new` create wizard only.

| PDF requirement | Current implementation status | File/component/API/model | Fixed | Remaining gap |
| --- | --- | --- | --- | --- |
| `/incidents/new` route | Implemented | `apps/web/src/app/(app)/incidents/new/page.tsx` | Yes | None |
| 12-step wizard | Implemented with named step files and responsive stepper | `features/incidents/components/create/steps/*`, `IncidentWizardStepper.tsx` | Yes | None |
| Report Type & Basic Info | Implemented event type, classification, title, short description, reporter, anonymous, restricted/confidential, tags | `ReportTypeBasicInfoStep.tsx` | Yes | None |
| Location & Time | Implemented site/unit/area hierarchy, exact location, event/reported date time, shift, workgroup, weather, operating mode, PTW/MOC/PSSR | `LocationTimeStep.tsx`, `GET /incidents/new/site-context` | Yes | None |
| Event Description | Implemented detailed description, activity, abnormal condition, immediate/potential consequence, suspected cause, response toggles | `EventDescriptionStep.tsx` | Yes | None |
| People / Injury / Exposure | Implemented people, counts, person type/name/role, injury/illness/exposure, treatment, PPE, route, confidential notes | `PeopleInjuryExposureStep.tsx`, `incident_people_initial` | Yes | None |
| Asset / Equipment / Chemical | Implemented equipment selection, snapshots, status, safeguard/IPL/SIS/PSV/alarm flags, chemical/SDS/release/process fields | `AssetEquipmentChemicalStep.tsx`, `incident_equipment_chemical_initial` | Yes | None |
| Actual Severity | Implemented separate actual severity, consequence category, injury/environment/asset/production/financial impact, notes | `ActualSeverityStep.tsx`, `incidents.actual_*` columns | Yes | None |
| Potential Severity / Risk Potential | Implemented separate potential severity, likelihood, backend score display, high-potential/fatality/major PSM flags, basis | `PotentialSeverityRiskStep.tsx`, `POST /incidents/calculate-potential-risk` | Yes | None |
| PSM / PSE / API RP 754 | Implemented PSM/PSE/tier/status, LOPC, release, threshold, fire/explosion, toxic exposure, basis, missing config state | `PsmPseClassificationStep.tsx`, `POST /incidents/classify-psm-pse` | Yes | None |
| Immediate Actions | Implemented action toggles, area safe, restart blocked, temp control expiry, notes | `ImmediateActionsStep.tsx`, `incident_immediate_actions_initial` | Yes | None |
| Initial Evidence / Attachments | Implemented evidence metadata capture and API upload/delete endpoints for storage-backed references | `InitialEvidenceStep.tsx`, `IncidentEvidenceUploader.tsx`, `incident_initial_evidence` | Yes | Actual binary upload depends on configured storage UI/service; this phase stores secure storage metadata and API hooks. |
| Investigation Priority & Follow-up | Implemented backend-generated recommendation display and owner/priority override controls | `InvestigationFollowupStep.tsx`, `POST /incidents/recommend-followups` | Yes | None |
| Review & Submit | Implemented final summary, backend validation, submit success dialog | `ReviewSubmitStep.tsx`, `IncidentSubmitSuccessDialog.tsx` | Yes | None |
| Save Draft | Implemented create/update draft with current step and draft JSON | `POST/PATCH /incidents/drafts`, `incident_drafts`, `useIncidentDraft.ts` | Yes | None |
| Resume Draft | Implemented draft query param and resume selector from context | `GET /incidents/drafts/:draftId`, `IncidentCreateWizard.tsx` | Yes | None |
| Delete Draft | API implemented and permission protected | `DELETE /incidents/drafts/:draftId` | Yes | No delete button in wizard UI; endpoint/hook exists. |
| Submit Incident | Implemented backend validation, incident number generation, child record inserts, audit/history | `POST /incidents`, `IncidentService.submitIncident` | Yes | Detail route `/incidents/:id` remains out of scope. |
| Incident number generation | Implemented year/site-scoped sequence prefix | `IncidentService.nextIncidentNumber` | Yes | None |
| Dashboard/register update | Submit invalidates `incidents` query key and writes to `incidents` table used by register | `useIncidentSubmit.ts`, `IncidentService.submitIncident` | Yes | None |
| Potential risk calculation backend source of truth | Implemented backend endpoint using configuration if available, Not Determined state if missing | `IncidentService.calculatePotentialRisk`, `riskMatrix` | Yes | None |
| PSM/PSE classification backend source of truth | Implemented backend endpoint using PSE threshold config if available, Not Determined state if missing | `IncidentService.classifyPsmPse`, `pseThresholdConfig` | Yes | None |
| Follow-up recommendations backend-generated | Implemented based on potential severity, PSM/PSE, safeguard failure, restart blocked, chemical/exposure, equipment flags | `IncidentService.recommendFollowups` | Yes | None |
| Lookups | Implemented equipment, chemicals, SDS, PTW, MOC, PSSR, users | `/incidents/lookups/*`, `genericLookup`, `equipmentSearch`, `chemicalSearch`, `userSearch` | Yes | Integrations return empty safely when source modules/tables are unavailable. |
| Permissions | Added constants, migration seed, controller decorators, frontend disabled reasons | `permission-keys.ts`, migrations, `IncidentController`, wizard UI | Yes | None |
| Restricted/confidential/medical protection | Backend validates restricted/confidential create permissions; UI disables restricted/confidential toggles; medical note field shows permission hint | `validateIncident`, `ReportTypeBasicInfoStep.tsx`, `PeopleInjuryExposureStep.tsx` | Yes | Medical field redaction on future detail pages is out of this wizard scope. |
| Company/site isolation | Implemented tenant/site scope checks and selected-site enforcement | `IncidentService.assertSiteAccess`, `scopeQuery` | Yes | None |
| Audit/history | Draft actions, evidence, submit create audit logs; submit writes incident history event | `IncidentService`, `AuditService`, `incident_history_events` | Yes | Draft history events are policy-dependent and currently audit-only until submission. |
| Dark/light responsive UI | Implemented cards, stepper, footer, mobile grids, dark/light Tailwind classes | `features/incidents/components/create/*` | Yes | None |
| Required states | Implemented loading/error/permission denied/draft loading/saved/failed/unsaved/validation/risk/classification/upload/submitting/success/missing config/mobile states | Wizard components/hooks | Yes | None |
| Verification | API build passes; focused incident frontend typecheck has no matching errors | `nest build`, focused `tsc` check | Yes | Full web typecheck still has unrelated existing non-incident errors. |
