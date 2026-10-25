# Enthovion PSM OS — AI Implementation Plan

Principle: the model proposes and explains; the application validates and enforces; authorized people decide.

## Fit with existing stack (discovered)
- API is **NestJS** (`apps/api`), not Express/FastAPI. AI orchestration starts **in-process** as `apps/api/src/ai`, behind interfaces so it can move to a Python service later.
- Auth/authz reuse `JwtAuthGuard` → `SiteGuard` → `PermissionsGuard`; `RequestUser` carries tenant/company/site scope.
- Retrieval reuses the existing `SearchIndex` table (tenant/site-scoped) before adding pgvector chunks.
- Audit: `AuditService` exists; AI adds its own tamper-evident hash-chained `AiAuditEvent`.

## Phase status
| Phase | Scope | Status |
|---|---|---|
| 0 | AI tables, authz scope, audit chain, prompt-injection guard, citation validator, LLM gateway abstraction | **Implemented (this change)** |
| 1 | Permission-aware Copilot (`POST /ai/copilot/ask`), safe non-AI fallback, deterministic LOPA tool (`POST /ai/tools/lopa`), AI status endpoint | **Implemented (this change)** |
| 1b | Document AI pipeline, pgvector embeddings job, Executive Report / Action Center summaries, UI panel | Next |
| 2 | PTW, MOC impact, PSSR, HAZOP drafts, LOPA integration with module records, Incident/MI assist | Planned |
| 3 | Verified graph (`AiRelationship` + recursive CTE), GraphRAG, risk/barrier, P&ID ingestion | Schema ready; services planned |
| 4 | Historian (read-only), anomaly detection, field voice/photo | Gated on Phase 3 exit |

## Controls implemented
1. Authz before retrieval: scope computed server-side from `RequestUser`; model never sees unscoped data.
2. Retrieved text is untrusted: delimited, injection patterns flagged, never treated as instructions.
3. Citations: answers must cite provided sources only; unknown/missing citations are flagged and uncited claims downgrade the answer.
4. Deterministic math: LOPA tool returns `incomplete` with missing inputs; no defaults.
5. Audit: every AI request/response recorded with source ids, model, prompt version, validation result; hash-chained.
6. Safe failure: with no model configured or on error, Copilot returns extractive search results; no workflow depends on AI.
7. Config: `AI_PROVIDER` (`disabled` default | `openai-compatible`), `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`.

## Deferred (needs decisions)
Model vendor/data-residency, embedding model, OCR/VLM vendor, evaluation datasets with site SMEs, UI design.
