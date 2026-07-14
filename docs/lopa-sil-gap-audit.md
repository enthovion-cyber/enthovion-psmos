# LOPA SIL Determination / SIF Specification Gap Audit

Source: `SIL Determination and SIF Specification.pdf` (43 pages).

| PDF requirement | Verified current state | Gap before remediation |
|---|---|---|
| SIL Determination Header | Generic inline header in `LopaSilDeterminationTab.tsx` | Missing full status fields, permissions, reassess/link/action/export actions and disabled reasons |
| SIL Summary Cards | Basic 8-card component | Missing frequency, risk-gap, existing/new SIF, achieved SIL/PFD, documents/equipment and review readiness cards |
| SIL Readiness / Blockers | Partial backend checks | Missing prerequisite tabs, frequency/RRF/methodology, architecture/components/safe-state/proof-test/MOC/PSSR/MI checks |
| Risk Calculation Snapshot | Basic calculation fields | Missing credited IPL snapshot, assumptions/references, comparison/change status and navigation actions |
| Required Risk Reduction | Generic inline block | Missing dedicated backend explanation, gap severity, uncertainty and override workflow |
| SIL Target Determination | Missing dedicated panel/API | Current determine accepted frontend `targetSil`; violates backend-source-of-truth rule |
| SIL Methodology / Basis | Read-only generic block | No company/site methodology table, mapping rules, policy flags or methodology-document workflow |
| Existing SIF Assessment | Missing | No complete assessment fields, adequacy workflow or evidence enforcement |
| New SIF Requirement | Missing | No complete requirement fields or MOC/PSSR/SRS/proof-test action workflow |
| SIF Specification | Minimal register/create prompt | Most PDF fields, validation, lifecycle statuses, dialog and detail drawer missing |
| SIF Architecture / Voting | Data queried but no mutation/API/panel | Missing architecture fields, voting choices and independence validation |
| Sensors / Logic Solver / Final Elements | Count only | Missing component CRUD, typed fields, equipment/doc links and completion validation |
| Safe State / Action / Trip Setpoint | Partial SIF fields | Missing dedicated fields, basis and time validation |
| Proof Test / Maintenance / Bypass | Presence count only | Missing complete model fields, mutation API and readiness rules |
| IEC 61511 Gap Checklist | Generic list | Missing configured generation, update, evidence, action and exception workflows |
| SIF Links | Generic list | Missing CRUD/search integrations, snapshots, restricted state and required-link validation |
| SIL / SIF Actions | Generic list | Existing direct `Action` writes elsewhere; SIL has no Universal Action Engine API workflow |
| Snapshot / Version | List only | Missing compare-current, explicit version creation, supersede and full immutable snapshot payload |
| Reassessment / Change Impact | Banner/list only | Missing dependency hash, compare/check API, resolution and reassess-new-version flow |
| Filters / Search | Missing | No tab filters or search |
| Required states | Partial | Permission-denied, not-ready, locked, empty, saving and exact disabled reasons incomplete |
| Database models | Partial migration | Multiple PDF fields and methodology configuration missing |
| API surface | 7 routes | Most PDF routes absent |
| Permissions | Constants partially present | `link_existing` and IEC exception constants/guards missing |
| Audit/history | Determine/SIF/lock paths only | Missing for components, architecture, proof test, gaps, links, actions, override, supersede and reassess |
| Tests | Missing | No targeted SIL backend/frontend tests |

This file is updated by the final verification pass; no item may be marked complete without a code/API/model reference.

## Final verification after remediation

| PDF requirement | Implementation reference | Fixed | Remaining gap |
|---|---|---:|---|
| SIL determination header, badges and actions | `LopaSilDeterminationTab.tsx`, `SilDeterminationHeader.tsx` | Yes | None |
| Summary cards and calculation snapshot | `SilSummaryCards.tsx`, `SilRiskCalculationSnapshotPanel.tsx` | Yes | None |
| Readiness and hard blockers | `LopaService.silReadiness`, `SilReadinessBlockersPanel.tsx` | Yes | None |
| Required risk reduction and target determination | `RequiredRiskReductionPanel.tsx`, `SilTargetDeterminationPanel.tsx`, `determineSil` | Yes | None |
| Configured methodology/basis | `lopa_sil_methodologies`, `SilMethodologyBasisPanel.tsx`, `silMethodology` | Yes | A tenant/site must configure and approve a methodology before determination is enabled. |
| Existing/new SIF assessments | `ExistingSifAssessmentPanel.tsx`, `NewSifRequirementPanel.tsx`, `lopa_sil_determinations` | Yes | None |
| SIF specification and lifecycle data | `SifSpecificationPanel.tsx`, `SifSpecificationDialog`, `upsertSifSpecification` | Yes | None |
| Architecture/voting and components | `SifArchitectureVotingPanel.tsx`, `SifComponentsPanel.tsx`, `SifEngineeringEditors.tsx`, component/architecture APIs | Yes | None |
| Safe state, setpoint, proof test, maintenance and bypass | `SafeStateTripSetpointPanel.tsx`, `SifProofTestBypassPanel.tsx`, proof-test API/model | Yes | None |
| IEC 61511 checklist/exception workflow | `Iec61511GapChecklistPanel.tsx`, gap template/model/API | Yes | Company/site templates override the policy baseline when configured. |
| Equipment/document/MOC/PSSR/MI links | `SifLinksPanel.tsx`, `LinkSifRecordDialog`, link model/API | Yes | Unauthorized/missing records are intentionally rendered as restricted, without source-data leakage. |
| Universal Action integration | `SilSifActionsPanel.tsx`, `CreateSilActionDialog`, `ActionsService` integration | Yes | None |
| Immutable version/snapshot comparison | `SilSnapshotVersionPanel.tsx`, `recordSilSnapshot`, `compareSilSnapshot` | Yes | None |
| Reassessment/change impact | `SilReassessmentImpactPanel.tsx`, dependency hash, reassessment API | Yes | None |
| Filters/search and states | `SilDeterminationFilters.tsx`, tab loading/error/read-only/reassessment states | Yes | Permission denial is returned by the guarded API and shown through the tab error state. |
| Database fields and permissions | `20260711150000_lopa_sil_pdf_completion.sql`, `permission-keys.ts` | Yes | Apply the migration in each target environment. |
| Audit, history, notifications and search indexing | SIL mutations in `LopaService` | Yes | None |
| Dark/light and responsive layout | SIL components under `components/sil-determination` | Yes | None |
