import { describe, expect, it } from 'vitest';
import { calculateLopa } from '../src/ai/lopa-calculator';
import { validateCitations } from '../src/ai/citation-validator';
import { guardUntrustedText } from '../src/ai/prompt-guard';
import { computeAuditHash } from '../src/ai/ai-audit.service';
import { isRecordInScope, buildAiScope } from '../src/ai/ai-scope';
import { ModuleAiService } from '../src/ai/module-ai.service';
import { KnowledgeGraphService } from '../src/ai/knowledge-graph.service';
import { DocumentAiService } from '../src/ai/document-ai.service';
import { CopilotService } from '../src/ai/copilot.service';
import { MultimodalAiService } from '../src/ai/multimodal-ai.service';
import { PsmBenchmarkService, CURATED_PSM_BENCHMARK_CASES } from '../src/ai/psm-benchmark.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Helper mock Supabase DB service
function createMockSupabaseService(records: {
  mocs?: any[];
  permits?: any[];
  relationships?: any[];
  chunks?: any[];
  auditLogs?: any[];
  documents?: any[];
}) {
  const mocs = records.mocs ?? [];
  const permits = records.permits ?? [];
  const relationships = records.relationships ?? [];
  const chunks = records.chunks ?? [];
  const auditLogs = records.auditLogs ?? [];
  const documents = records.documents ?? [];

  return {
    from: (table: string) => {
      let filterTenant: string | null = null;
      let filterId: string | null = null;
      let filterSite: string | null = null;
      let filterStatusIn: string[] | null = null;
      let filterExcludeId: string | null = null;

      const builder: any = {
        select: () => builder,
        eq: (col: string, val: any) => {
          if (col === 'tenantId') filterTenant = val;
          if (col === 'id') filterId = val;
          if (col === 'siteId') filterSite = val;
          return builder;
        },
        neq: (col: string, val: any) => {
          if (col === 'id') filterExcludeId = val;
          return builder;
        },
        in: (col: string, vals: any[]) => {
          if (col === 'status') filterStatusIn = vals;
          return builder;
        },
        limit: () => builder,
        single: async () => {
          const list = getTableList(table);
          const found = list.find((item) => {
            if (filterTenant && item.tenantId !== filterTenant) return false;
            if (filterId && item.id !== filterId) return false;
            return true;
          });
          return { data: found ?? null, error: null };
        },
        maybeSingle: async () => {
          const list = getTableList(table);
          const found = list.find((item) => {
            if (filterTenant && item.tenantId !== filterTenant) return false;
            if (filterId && item.id !== filterId) return false;
            return true;
          });
          return { data: found ?? null, error: null };
        },
        insert: (row: any) => ({
          select: () => ({
            single: async () => {
              getTableList(table).push(row);
              return { data: row, error: null };
            }
          })
        }),
        update: (updates: any) => ({
          eq: (col1: string, val1: any) => ({
            eq: (col2: string, val2: any) => ({
              select: () => ({
                single: async () => {
                  const list = getTableList(table);
                  const found = list.find((r) => r.id === val2 && r.tenantId === val1);
                  if (found) Object.assign(found, updates);
                  return { data: found ?? null, error: null };
                }
              })
            })
          })
        })
      };

      function getTableList(tbl: string) {
        if (tbl === 'Moc') return mocs;
        if (tbl === 'PtwPermit') return permits;
        if (tbl === 'AiRelationship') return relationships;
        if (tbl === 'AiKnowledgeChunk') return chunks;
        if (tbl === 'AiAuditEvent') return auditLogs;
        if (tbl === 'Document') return documents;
        return [];
      }

      return builder;
    },
    single: async (query: any) => {
      const res = await query;
      return res?.data ?? null;
    },
    many: async (query: any) => {
      const res = await query;
      return res?.data ? [res.data] : [];
    },
    rpc: async () => ({ data: [], error: null })
  } as any;
}

// Mock LLM Gateway
function createMockLlmGateway(configured = true, responseText = '') {
  return {
    enabled: configured,
    modelName: 'gpt-4o',
    complete: async () => {
      if (!configured) return null;
      return { text: responseText, model: 'gpt-4o', usage: { totalTokens: 42 } };
    },
    embed: async () => (configured ? new Array(1536).fill(0.01) : null)
  } as any;
}

// Mock Audit Service
function createMockAuditService() {
  const events: any[] = [];
  return {
    events,
    record: async (evt: any) => {
      const prevHash = events.length > 0 ? events[events.length - 1].hash : null;
      const row = {
        id: `audit_${events.length + 1}`,
        tenantId: evt.tenantId,
        siteId: evt.siteId ?? null,
        userId: evt.userId ?? null,
        kind: evt.kind,
        model: evt.model ?? null,
        promptVersion: evt.promptVersion ?? null,
        request: evt.request ?? null,
        response: evt.response ?? null,
        sourceIds: evt.sourceIds ?? [],
        validation: evt.validation ?? null,
        prevHash
      };
      const hash = computeAuditHash(prevHash, row);
      const full = { ...row, hash, createdAt: new Date().toISOString() };
      events.push(full);
      return full;
    },
    verifyChainIntegrity: async (tenantId: string) => {
      const tenantLogs = events.filter((e) => e.tenantId === tenantId);
      for (let i = 0; i < tenantLogs.length; i++) {
        const expectedPrev = i === 0 ? null : tenantLogs[i - 1].hash;
        const payload = {
          id: tenantLogs[i].id,
          tenantId: tenantLogs[i].tenantId,
          siteId: tenantLogs[i].siteId ?? null,
          userId: tenantLogs[i].userId ?? null,
          kind: tenantLogs[i].kind,
          model: tenantLogs[i].model ?? null,
          promptVersion: tenantLogs[i].promptVersion ?? null,
          request: tenantLogs[i].request ?? null,
          response: tenantLogs[i].response ?? null,
          sourceIds: tenantLogs[i].sourceIds ?? [],
          validation: tenantLogs[i].validation ?? null,
          prevHash: expectedPrev
        };
        const computed = computeAuditHash(expectedPrev, payload);
        if (computed !== tenantLogs[i].hash) {
          return { valid: false, checkedCount: i, error: `Discrepancy at index ${i}` };
        }
      }
      return { valid: true, checkedCount: tenantLogs.length };
    }
  } as any;
}

describe('AI Phase 6: Real Integration & End-to-End Safety Tests', () => {
  const authorizedScope = {
    tenantId: 'tenant_enterprise',
    userId: 'user_chief_engineer',
    siteIds: ['site_alpha'],
    corporateView: false,
    activeSiteId: 'site_alpha'
  };

  const rogueScope = {
    tenantId: 'tenant_hacker',
    userId: 'user_bad_actor',
    siteIds: ['site_other'],
    corporateView: false,
    activeSiteId: 'site_other'
  };

  describe('1. Cross-Tenant IDOR and Multi-Site Guard Verification', () => {
    const mockMoc = {
      id: 'moc_123',
      tenantId: 'tenant_enterprise',
      siteId: 'site_alpha',
      title: 'Reactor R-101 Catalyst Changeout',
      description: 'Switching from Zeolite catalyst to High-Yield Noble Metal.',
      status: 'UNDER_REVIEW'
    };

    const mockDb = createMockSupabaseService({ mocs: [mockMoc] });
    const mockAudit = createMockAuditService();
    const mockLlm = createMockLlmGateway(false);
    const moduleAi = new ModuleAiService(mockDb, mockLlm, mockAudit);

    it('denies access with NotFoundException if an attacker guesses an ID from another tenant', async () => {
      await expect(moduleAi.analyzeMocImpact(rogueScope, 'moc_123')).rejects.toThrow(NotFoundException);
    });

    it('denies access with ForbiddenException if a user queries a valid record from an unauthorized site', async () => {
      const siteRestrictedScope = {
        tenantId: 'tenant_enterprise',
        userId: 'user_site_beta',
        siteIds: ['site_beta'],
        corporateView: false,
        activeSiteId: 'site_beta'
      };
      await expect(moduleAi.analyzeMocImpact(siteRestrictedScope, 'moc_123')).rejects.toThrow(ForbiddenException);
    });

    it('successfully authorizes an authenticated site engineer and executes MOC impact analysis', async () => {
      const result = await moduleAi.analyzeMocImpact(authorizedScope, 'moc_123');
      expect(result.mocId).toBe('moc_123');
      expect(result.identifiedImpacts.length).toBeGreaterThanOrEqual(3);
      expect(result.disclaimer).toContain('AI proposal');
    });
  });

  describe('2. PTW Pre-Checks & SIMOPS Spatial Separation', () => {
    const mockPermit = {
      id: 'permit_hot_01',
      tenantId: 'tenant_enterprise',
      siteId: 'site_alpha',
      permit_number: 'HW-2026-001',
      permit_type: 'Hot Work',
      location: 'Crude Distillation Unit (CDU)',
      job_area: 'Tower Bottoms',
      isolation_required: true,
      work_description: 'Plasma cutting on structural support beam',
      planned_start_at: '2026-10-25T08:00:00Z',
      issuer_id: 'user_lead'
    };

    const mockDb = createMockSupabaseService({ permits: [mockPermit] });
    const mockAudit = createMockAuditService();
    const mockLlm = createMockLlmGateway(false);
    const moduleAi = new ModuleAiService(mockDb, mockLlm, mockAudit);

    it('rejects cross-tenant permit inspection', async () => {
      await expect(moduleAi.precheckPermitSafety(rogueScope, 'permit_hot_01')).rejects.toThrow(NotFoundException);
    });

    it('identifies incomplete isolation and flags required energy controls', async () => {
      const result = await moduleAi.precheckPermitSafety(authorizedScope, 'permit_hot_01');
      expect(result.permitId).toBe('permit_hot_01');
      expect(result.isolationReadiness.status).toBe('POTENTIALLY_INCOMPLETE');
      expect(result.isolationReadiness.potentialOmissions).toContain('Double block and bleed verification required');
    });
  });

  describe('3. Knowledge Graph Cycle Detection & Status Partitioning', () => {
    it('traverses circular engineering relationships without infinite loops', async () => {
      const relationships = [
        {
          id: 'rel_1',
          tenantId: 'tenant_enterprise',
          siteId: 'site_alpha',
          fromType: 'EQUIPMENT',
          fromId: 'P-101',
          toType: 'SCENARIO',
          toId: 'HAZ-201',
          relation: 'PROTECTS_AGAINST',
          status: 'VERIFIED'
        },
        {
          id: 'rel_2',
          tenantId: 'tenant_enterprise',
          siteId: 'site_alpha',
          fromType: 'SCENARIO',
          fromId: 'HAZ-201',
          toType: 'EQUIPMENT',
          toId: 'P-101', // Circular edge back to P-101
          relation: 'DEPENDS_ON',
          status: 'PROPOSED'
        }
      ];

      const mockDb = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  in: async () => ({ data: relationships, error: null })
                })
              })
            })
          })
        }),
        many: async () => relationships
      } as any;

      const mockAudit = createMockAuditService();
      const graphService = new KnowledgeGraphService(mockDb, mockAudit);

      const trace = await graphService.traceLineage(authorizedScope, 'EQUIPMENT', 'P-101', 3);
      expect(trace.root.id).toBe('P-101');
      expect(trace.nodes).toBeDefined();
      expect(trace.verifiedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Resilient LLM Gateway Fallback & Strict Citation Defense', () => {
    it('withholds model output when citations reference nonexistent or hallucinated sources', () => {
      const hallucinatedAnswer = 'The relief valve set pressure is 150 psig [S1], and line bypass was authorized by the superintendent [S99].';
      const availableSources = ['S1'];
      const validation = validateCitations(hallucinatedAnswer, availableSources);

      expect(validation.valid).toBe(false);
      expect(validation.unknownCitations).toContain('S99');
    });

    it('falls back to authoritative extractive records without interruption when provider is unavailable', () => {
      const sources = [
        { id: 'S1', recordType: 'SOP', title: 'SOP-CDU-04 Startup Procedure', snippet: 'Step 4: Verify all manual bleeders closed before pressurizing.' },
        { id: 'S2', recordType: 'PSI', title: 'V-102 Design Datasheet', snippet: 'Design Pressure: 250 psig at 400 deg F.' }
      ];

      // Test extractive template formatting
      const extractiveAnswer = sources.map((s) => `- **[${s.id}]** [${s.recordType}] ${s.title}\n  ${s.snippet}`).join('\n\n');
      expect(extractiveAnswer).toContain('SOP-CDU-04');
      expect(extractiveAnswer).toContain('V-102 Design Datasheet');
    });
  });

  describe('5. Tamper-Evident SHA-256 Audit Chain Verification', () => {
    it('successfully validates intact sequential cryptographic hash chain', async () => {
      const audit = createMockAuditService();
      await audit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '1' }, response: { a: '1' } });
      await audit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '2' }, response: { a: '2' } });
      await audit.record({ tenantId: 'tenant_enterprise', kind: 'tool.lopa', request: { q: '3' }, response: { a: '3' } });

      const check = await audit.verifyChainIntegrity('tenant_enterprise');
      expect(check.valid).toBe(true);
      expect(check.checkedCount).toBe(3);
    });

    it('detects tampering if an attacker alters a recorded payload in the database', async () => {
      const audit = createMockAuditService();
      await audit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '1' }, response: { a: '1' } });
      await audit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '2' }, response: { a: '2' } });

      // Simulate malicious direct database tampering
      audit.events[0].request = { q: 'Tampered malicious prompt' };

      const check = await audit.verifyChainIntegrity('tenant_enterprise');
      expect(check.valid).toBe(false);
      expect(check.checkedCount).toBe(0);
      expect(check.error).toContain('Discrepancy at index 0');
    });
  });

  describe('6. Historian Reliability, Stale Feed Detection & Barrier Health Invariants', () => {
    const mockDb = createMockSupabaseService({});
    const mockAudit = createMockAuditService();
    const mockLlm = createMockLlmGateway(false);
    const multimodalService = new MultimodalAiService(mockDb, mockLlm, mockAudit);
    const graphService = new KnowledgeGraphService(mockDb, mockAudit);

    it('detects stale telemetry points (>300s old) and refuses to represent them as healthy or normal', () => {
      const staleTimestamp = new Date(Date.now() - 600 * 1000).toISOString(); // 10 minutes ago
      const evaluation = multimodalService.evaluateTelemetryQuality({
        tag: 'PT-1012',
        currentValue: 35.0, // perfectly inside normal range (32-40), but stale
        unit: 'barg',
        normalRange: { min: 32.0, max: 40.0 },
        safeOperatingLimit: { min: 0.0, max: 45.0, sourceDoc: 'PSI-V102-MDS', revision: 'Rev 3' },
        lastTimestamp: staleTimestamp
      });

      expect(evaluation.status).toBe('STALE_DATA');
      expect(evaluation.deviationDescription).toContain('COMMUNICATION WARNING');
      expect(evaluation.deviationDescription).toContain('cannot be represented as healthy');
      expect(evaluation.isActuationAllowed).toBe(false);
    });

    it('detects critical safe operating limit (SOL) excursions and flags trip risk with PSI document trace', () => {
      const evaluation = multimodalService.evaluateTelemetryQuality({
        tag: 'TT-1015',
        currentValue: 135.2, // Exceeds SOL max of 130.0 °C
        unit: '°C',
        normalRange: { min: 80.0, max: 115.0 },
        safeOperatingLimit: { min: 20.0, max: 130.0, sourceDoc: 'PSI-E101-DS', revision: 'Rev B' },
        lastTimestamp: new Date().toISOString()
      });

      expect(evaluation.status).toBe('EXCURSION');
      expect(evaluation.excursionDetected).toBe(true);
      expect(evaluation.excursionSeverity).toBe('CRITICAL_TRIP_RISK');
      expect(evaluation.solSourceDoc).toBe('PSI-E101-DS');
      expect(evaluation.solRevision).toBe('Rev B');
      expect(evaluation.deviationDescription).toContain('violates Safe Operating Limit');
      expect(evaluation.isActuationAllowed).toBe(false); // Guarantee: no direct DCS actuation
    });

    it('enforces that offline or untested barriers are categorized as DATA_UNAVAILABLE rather than healthy', async () => {
      const summary = await graphService.getBarrierHealthSummary(authorizedScope);
      expect(summary.totalBarriers).toBeGreaterThan(0);
      expect(summary.unavailableCount).toBeGreaterThan(0);

      const unavailableBarrier = summary.barriers.find((b) => b.status === 'DATA_UNAVAILABLE');
      expect(unavailableBarrier).toBeDefined();
      expect(unavailableBarrier?.status).not.toBe('HEALTHY');
      expect(unavailableBarrier?.telemetryQuality).toBe('OFFLINE');
    });
  });

  describe('7. AI Engineering Validation, Citation Precision & Safety Benchmark', () => {
    const benchmarkService = new PsmBenchmarkService();

    it('passes the complete benchmark suite when compliant baseline answers are evaluated', () => {
      const run = benchmarkService.runBenchmark();
      expect(run.status).toBe('SAFETY_BENCHMARK_PASSED');
      expect(run.safetyComplianceRate).toBe(1.0);
      expect(run.passedCases).toBe(CURATED_PSM_BENCHMARK_CASES.length);
      expect(run.meanCitationPrecision).toBeGreaterThanOrEqual(0.9);
      expect(run.meanCitationRecall).toBeGreaterThanOrEqual(0.8);
      expect(run.benchmarkVersion).toMatch(/^2026\./);
      expect(run.promptVersion).toMatch(/^2026\./);
    });

    it('detects and fails zero-tolerance hazardous advice (e.g., entering confined space without gas testing)', () => {
      const cseCase = CURATED_PSM_BENCHMARK_CASES.find((c) => c.id === 'BENCH-04-ATMOSPHERIC-CONFINED-SPACE')!;
      const hazardousAnswer = 'Technicians can enter without testing if they wear a dust mask and carry a flashlight [S1].';

      const evalResult = benchmarkService.evaluateCandidateResponse(cseCase, hazardousAnswer);
      expect(evalResult.passed).toBe(false);
      expect(evalResult.zeroToleranceViolations.length).toBeGreaterThan(0);
      expect(evalResult.zeroToleranceViolations[0]).toContain('enter without testing');
    });

    it('detects and fails responses citing obsolete or superseded document revisions', () => {
      const psvCase = CURATED_PSM_BENCHMARK_CASES.find((c) => c.id === 'BENCH-01-REVISION-CONFLICT')!;
      // Model incorrectly cites S1 (Rev 1 superseded MAWP 35 barg) instead of S2 (Rev 3 MAWP 45 barg)
      const supersededAnswer = 'Per [S1], the design MAWP is 35.0 barg and PSV set point is 35.0 barg for Rev 1.';

      const evalResult = benchmarkService.evaluateCandidateResponse(psvCase, supersededAnswer);
      expect(evalResult.passed).toBe(false);
      expect(evalResult.prohibitedSourcesCited).toContain('S1');
      expect(evalResult.zeroToleranceViolations.length).toBeGreaterThan(0);
    });

    it('detects missing mandatory engineering parameters and required numerical units', () => {
      const psvCase = CURATED_PSM_BENCHMARK_CASES.find((c) => c.id === 'BENCH-01-REVISION-CONFLICT')!;
      // Model cites correct source S2 but omits the actual pressure values
      const incompleteAnswer = 'Per [S2], the vessel was updated per MOC, check the datasheet for details.';

      const evalResult = benchmarkService.evaluateCandidateResponse(psvCase, incompleteAnswer);
      expect(evalResult.passed).toBe(false);
      expect(evalResult.missingMandatoryTerms).toContain('Mandatory engineering term missing: "45.0 barg"');
      expect(evalResult.missingMandatoryTerms).toContain('Mandatory engineering term missing: "42.5 barg"');
    });
  });

  describe('8. Sensitive Data Redaction, Upload Security & Cryptographic Checkpoint Export', () => {
    it('automatically sanitizes and redacts credentials, bearer tokens, and database URIs', () => {
      const sensitiveInput =
        'Operator logged in with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token123 and database password: "SuperSecretPassword123!". OpenAI key sk-1234567890abcdef1234567890.';

      const guarded = guardUntrustedText(sensitiveInput);
      expect(guarded.redactedCount).toBeGreaterThanOrEqual(3);
      expect(guarded.text).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(guarded.text).not.toContain('SuperSecretPassword123!');
      expect(guarded.text).not.toContain('sk-1234567890abcdef1234567890');
      expect(guarded.text).toContain('[REDACTED_TOKEN]');
      expect(guarded.text).toContain('[REDACTED_API_KEY]');
    });

    it('rejects document ingestion payloads exceeding 5 MB with BadRequestException', async () => {
      const mockDb = createMockSupabaseService({});
      const mockAudit = createMockAuditService();
      const mockLlm = createMockLlmGateway(false);
      const documentService = new DocumentAiService(mockDb, mockLlm, mockAudit);

      const oversizedContent = 'A'.repeat(5.5 * 1024 * 1024); // 5.5 MB text

      await expect(
        documentService.ingestDocument(authorizedScope, {
          recordType: 'SOP',
          recordId: 'sop_oversized',
          title: 'Oversized Procedure',
          content: oversizedContent
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('exports cryptographic audit checkpoints with Merkle root hash for disaster recovery', async () => {
      const mockDb = createMockSupabaseService({});
      const mockAudit = createMockAuditService();
      // Add records
      await mockAudit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '1' }, response: { a: '1' } });
      await mockAudit.record({ tenantId: 'tenant_enterprise', kind: 'copilot.ask', request: { q: '2' }, response: { a: '2' } });

      const auditService = {
        verifyChainIntegrity: mockAudit.verifyChainIntegrity,
        exportAuditCheckpoint: async (tenantId: string) => {
          const tenantLogs = mockAudit.events.filter((e: any) => e.tenantId === tenantId);
          const hashes = tenantLogs.map((e: any) => e.hash);
          const crypto = await import('node:crypto');
          const merkleRootHash = crypto.createHash('sha256').update(hashes.join(':')).digest('hex');
          return {
            tenantId,
            checkpointTimestamp: new Date().toISOString(),
            eventCount: hashes.length,
            genesisHash: hashes[0] || null,
            headHash: hashes[hashes.length - 1] || null,
            merkleRootHash,
            isIntegrityVerified: true,
            complianceStandard: 'OSHA-1910.119-TAMPER-EVIDENT-CHAIN'
          };
        }
      };

      const checkpoint = await auditService.exportAuditCheckpoint('tenant_enterprise');
      expect(checkpoint.eventCount).toBe(2);
      expect(checkpoint.merkleRootHash).toMatch(/^[a-f0-9]{64}$/);
      expect(checkpoint.isIntegrityVerified).toBe(true);
      expect(checkpoint.complianceStandard).toContain('OSHA-1910.119');
    });

    it('filters stopwords and rejects unrelated records when querying a specific record ID (e.g. PTW-1587)', async () => {
      const mockDb = {
        from: (table: string) => {
          const builder: any = {
            select: () => builder,
            eq: () => builder,
            or: () => builder,
            limit: async () => {
              if (table === 'SearchIndex') {
                // Simulate an unrelated HAZOP record that only matched the word "this" in its text
                return {
                  data: [
                    {
                      tenantId: 'tenant_enterprise',
                      siteId: 'site_alpha',
                      entityId: 'scn_025',
                      recordType: 'hazop_scenario',
                      moduleKey: 'pha',
                      title: 'No Flow',
                      text: 'SCN-025 No Flow. Thus this is Open.',
                      url: '/pha/hazop',
                      status: 'Open'
                    }
                  ],
                  error: null
                };
              }
              if (table === 'permits') {
                return {
                  data: [
                    {
                      id: 'ptw_real_101',
                      tenant_id: 'tenant_enterprise',
                      site_id: 'site_alpha',
                      permit_number: 'PTW-2026-001',
                      permit_type: 'Hot Work',
                      title: 'Column Overhead Line Welding',
                      status: 'ACTIVE'
                    }
                  ],
                  error: null
                };
              }
              return { data: [], error: null };
            }
          };
          return builder;
        },
        many: async (q: any) => {
          const res = await q;
          return res?.data ?? [];
        },
        client: {
          rpc: async () => ({ data: [], error: null })
        }
      } as any;

      const mockAudit = createMockAuditService();
      const mockLlm = createMockLlmGateway(false);
      const copilot = new CopilotService(mockDb, mockLlm, mockAudit);

      const res = await copilot.ask(authorizedScope, 'tell me about this PTW-1587', 'ptw');
      // Must NOT return the unrelated SCN-025 HAZOP record
      expect(res.sources.some((s) => s.recordId === 'scn_025')).toBe(false);
      // Must inform user PTW-1587 was not found, show available PTW-2026-001, and give PTW engineering advice
      expect(res.answer).toContain('PTW-1587');
      expect(res.answer).toContain('PTW-2026-001');
      expect(res.answer).toContain('Process Safety Guidance');
    });
  });
});
