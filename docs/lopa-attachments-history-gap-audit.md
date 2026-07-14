# LOPA Attachments and History PDF Gap Audit

Source: `LOPA Study Attachments and History Tabs.pdf` (39 pages), read in full on 2026-07-11.

| PDF requirement | Verified current state | Gap before remediation |
|---|---|---|
| Attachments header and summary | Minimal inline header and seven plain counters | Missing full values, actions, badges, responsive light theme and filter navigation |
| Required evidence/readiness | Backend checklist exists | Incomplete evidence requirements, no owner/due/action states or full readiness integration |
| Attachment register and filters | Basic page slice and two filters | Missing complete columns, server filters/sorting, selection, detail drawer, state badges and actions |
| Upload, replace, preview and download | Base upload/replace/access methods exist | Browser prompt UI, no dialog/progress/retry/bulk upload and missing metadata fields |
| Versions, controlled documents, mappings, comments | Models/base writes exist | No complete API surface or panels; comments update/delete, document refresh and version/history endpoints absent |
| Classification, restricted access and bulk actions | Basic metadata/redaction exists | Missing policy fields, safe detail redaction, classification-specific permission route and controlled bulk workflows |
| Attachment audit/readiness/search | Several mutation history writes exist | Some mutation audit calls/readiness refresh/search indexing missing; export index absent |
| History header, cards, timeline/register | Minimal mixed timeline/table exists | Missing full summary, chronological grouping, register actions, detail drawer and filters |
| History diff, audit metadata and redaction | Basic top-level diff exists | Missing nested diff, audit metadata endpoint, sensitive-field redaction policy and safe restricted details |
| Module/workflow/export | Basic module/workflow array and JSON export exist | Missing dedicated endpoints/context and UI panels with permission-aware export controls |
| Database/permissions | Base migration includes most tables; partial constants/guards | Needs policy fields/indexes, missing permission constants/route guards and immutable-history protection |
| Tests/final verification | No targeted attachments/history checks | Missing scoped build verification and second PDF checklist |

This checklist is updated after implementation. Items are only marked complete with a concrete file/API/model reference.

## Final PDF Cross-check

| PDF requirement | Current implementation status | File/component/API/model | Fixed | Remaining gap |
|---|---|---|---:|---|
| Attachments header, KPI cards, filters, register and bulk actions | Implemented with backend data and read-only behavior | LopaAttachmentsTab.tsx, AttachmentsHeader.tsx, AttachmentSummaryCards.tsx, AttachmentFilters.tsx, AttachmentRegister.tsx | Yes | None |
| Required evidence and readiness | Backend generated checklist, persisted readiness, overview/review-ready study fields | attachmentReadiness, lopa_attachment_readiness, 20260711160000 migration | Yes | Migration must be applied |
| Secure upload, validation, preview/download, replacement/versioning | Storage-backed upload/replace and API access with audit/history | uploadAttachment, replaceAttachment, attachmentAccess, UploadAttachmentDialog.tsx | Yes | Preview streams through the API, so no private storage URL is exposed |
| Detail drawer, preview, versions, classification/access state | Implemented | AttachmentDetailDrawer.tsx, FilePreviewPanel.tsx, AttachmentVersionHistoryPanel.tsx, AttachmentPermissionsPanel.tsx | Yes | None |
| Controlled document search/link/refresh | Implemented with site-scoped Document Control lookup and snapshots | LinkControlledDocumentDialog.tsx, attachmentDocumentSearch, refreshAttachmentDocument | Yes | Restricted documents are safely omitted/redacted by source access |
| Evidence mappings/comments | CRUD APIs and real UI mapping action; mapping changes refresh readiness and audit | evidence mapping/comment APIs, EvidenceMappingDialog.tsx | Yes | None |
| Archive/restore/delete/bulk export/download | Implemented as soft-state mutations; bulk download returns only eligible secure API download paths | attachment bulk APIs and AttachmentBulkActions.tsx | Yes | ZIP generation is not used; allowed files open through their individual authenticated download endpoint |
| History header, cards, timeline, register, filters and export | Implemented with server-side query data | LopaHistoryTab.tsx, HistoryHeader.tsx, HistorySummaryCards.tsx, HistoryTimeline.tsx, HistoryRegister.tsx | Yes | None |
| Event detail, before/after diff, audit metadata and restricted state | Implemented as read-only drawer and guarded APIs | EventDetailDrawer.tsx, ChangeDiffPanel.tsx, AuditMetadataPanel.tsx, history APIs | Yes | IP/device values display only when the existing audit system has captured them |
| Module activity and workflow approval timeline | Implemented from immutable LOPA history events | ModuleActivityBreakdownPanel.tsx, WorkflowApprovalTimelinePanel.tsx | Yes | None |
| Database model completion and immutable history | Implemented without duplicate history table | 20260711160000_lopa_attachments_history_pdf_completion.sql | Yes | Migration must be applied |
| Permissions, audit logs, Global Search-safe metadata, company/site/read-only policy | Enforced in service/controller mutation paths and scope checks | lopa.service.ts, lopa.controller.ts, permission-keys.ts | Yes | User permissions remain the final authority for UI/API access |
| Dark/light/responsive state handling | Implemented with responsive grids, horizontal tables and full-screen mobile drawers | attachments/history component folders | Yes | None |

Verification completed:

- API Nest build passes.
- Scoped Attachments and History frontend TypeScript check passes.
- The workspace has unrelated pre-existing frontend TypeScript failures outside these files, so a global frontend typecheck is not clean.
