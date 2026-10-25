'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Eye,
  FileSearch,
  Flame,
  Gauge,
  Layers,
  Mic,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '@/services/api';
import { useCopilotStore } from '@/features/ai/stores/useCopilotStore';
import { useMutationToast } from '@/providers/ToastProvider';

const unwrap = <T,>(response: { data: { data: T } | T }) => {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
};

export function MultimodalOperationsPage() {
  const { openDrawer } = useCopilotStore();
  const toast = useMutationToast();

  const [activeTab, setActiveTab] = useState<'pid' | 'field' | 'historian'>('pid');

  // 1. P&ID Vision States
  const [drawingNumber, setDrawingNumber] = useState('PID-01002-REV-C');
  const [drawingRevision, setDrawingRevision] = useState('3.1');
  const [ocrText, setOcrText] = useState(
    'PUMP P-101A/B ELEV 102.5M. SUCTION 4"-HC-1002 FROM VESSEL V-102. RELIEF VALVE PSV-102A SET 42.5 BARG. EMERGENCY SHUTDOWN ESD-101 ON DISCHARGE. DESIGN TEMP 120 C.'
  );
  const [pidResult, setPidResult] = useState<any>(null);

  // 2. Field Capture States
  const [audioTranscript, setAudioTranscript] = useState(
    'Noted hydrocarbon drip leaking from the seal gland on pump P-101A. The drip pan is about half full. No audible abnormal vibration but slight odor noticed in Area 2.'
  );
  const [detectedTagHint, setDetectedTagHint] = useState('P-101A');
  const [fieldResult, setFieldResult] = useState<any>(null);

  // 3. Telemetry States
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [excursionResult, setExcursionResult] = useState<any>(null);

  // Queries & Mutations
  const pidMutation = useMutation({
    mutationFn: () =>
      api
        .post('/ai/multimodal/pid-extract', {
          drawingNumber,
          revision: drawingRevision,
          drawingOcrText: ocrText
        })
        .then(unwrap<any>),
    onSuccess: (data) => {
      setPidResult(data);
      toast.success('P&ID Extraction Complete', `Identified ${data.detectedEquipment?.length || 0} equipment items.`);
    }
  });

  const fieldMutation = useMutation({
    mutationFn: () =>
      api
        .post('/ai/multimodal/field-observation', {
          audioTranscript,
          detectedTagHint
        })
        .then(unwrap<any>),
    onSuccess: (data) => {
      setFieldResult(data);
      toast.success('Field Observation Drafted', 'AI synthesized voice & observation into structured draft.');
    }
  });

  const telemetryQuery = useQuery({
    queryKey: ['ai', 'historian', 'telemetry'],
    queryFn: () => api.get('/ai/multimodal/historian/telemetry').then(unwrap<any>)
  });

  const excursionMutation = useMutation({
    mutationFn: ({ tag, currentValue }: { tag: string; currentValue: number }) =>
      api.post('/ai/multimodal/historian/evaluate-excursion', { tag, currentValue }).then(unwrap<any>),
    onSuccess: (data) => {
      setExcursionResult(data);
    }
  });

  return (
    <main className="space-y-6">
      {/* Header Banner */}
      <section className="psm-card p-6 border-l-4 border-l-purple-600 dark:border-l-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
              <Eye className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Advanced Multimodal & Operational Intelligence</h1>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Phase 5 Capabilities
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-muted)] max-w-3xl">
                Engineering drawing vision extraction (P&ID), mobile field voice & photo ingestion, and read-only operational telemetry integration with Safe Operating Limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => openDrawer('psi')}
              className="psm-button border border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Copilot
            </button>
          </div>
        </div>
      </section>

      {/* Multimodal Selector Tabs */}
      <div className="flex border-b border-[var(--psm-line)] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pid')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'pid'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
          }`}
        >
          <FileSearch className="w-4 h-4" />
          P&ID Vision & Topology Extraction
        </button>

        <button
          onClick={() => setActiveTab('field')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'field'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
          }`}
        >
          <Mic className="w-4 h-4" />
          Field Voice & Photo AI Ingestion
        </button>

        <button
          onClick={() => setActiveTab('historian')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'historian'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-fg)]'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Read-Only Historian & Safe Limits
        </button>
      </div>

      {/* TAB 1: P&ID Vision Pipeline */}
      {activeTab === 'pid' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="psm-card p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-purple-500" />
                Drawing Specifications & Ingestion
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--psm-muted)] font-medium mb-1">Drawing Identifier</label>
                  <input
                    type="text"
                    value={drawingNumber}
                    onChange={(e) => setDrawingNumber(e.target.value)}
                    className="psm-input w-full px-3 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--psm-muted)] font-medium mb-1">Approved Revision</label>
                  <input
                    type="text"
                    value={drawingRevision}
                    onChange={(e) => setDrawingRevision(e.target.value)}
                    className="psm-input w-full px-3 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--psm-muted)] font-medium mb-1">
                    Drawing Text / Vector OCR Stream
                  </label>
                  <textarea
                    rows={6}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    className="psm-input w-full p-2.5 font-mono text-[11px]"
                  />
                </div>

                <button
                  onClick={() => pidMutation.mutate()}
                  disabled={pidMutation.isPending || !ocrText.trim()}
                  className="psm-button psm-button-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {pidMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Execute P&ID AI Extraction
                </button>
              </div>
            </div>

            <div className="psm-card p-4 space-y-2 border-dashed">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Engineering Topology Verification Rule
              </div>
              <p className="text-[11px] text-[var(--psm-muted)] leading-relaxed">
                A line that visually approaches a valve symbol is not legal proof of connectivity. Extracted piping line lists and relief set pressures must be checked by a designated engineer.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {pidResult ? (
              <div className="space-y-4">
                {/* Detected Equipment */}
                <div className="psm-card overflow-hidden">
                  <div className="p-3.5 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                      Extracted Equipment Elements ({pidResult.detectedEquipment?.length || 0})
                    </span>
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                      Rev: {pidResult.revision}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)] uppercase bg-[var(--psm-surface)]">
                          <th className="py-2.5 px-3">Asset Tag</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Engineering Rating</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--psm-line)]">
                        {pidResult.detectedEquipment?.map((eq: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[var(--psm-surface-2)]">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {eq.tag}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[10px] uppercase text-[var(--psm-muted)]">
                              {eq.type}
                            </td>
                            <td className="py-2.5 px-3 text-[var(--psm-fg)]">{eq.description}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--psm-muted)]">
                              {eq.specifications || 'Standard spec'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                PROPOSED
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Safety Devices & Line Connectivity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="psm-card p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      Critical Safety & Relief Devices
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {pidResult.safetyDevices?.map((dev: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] flex justify-between">
                          <span className="font-mono font-bold text-[var(--psm-fg)]">{dev.tag} ({dev.deviceType})</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">{dev.setPressure || 'Trip Signal'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="psm-card p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Piping Line Connectivity
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {pidResult.pipingAndLines?.map((line: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] text-[11px]">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{line.lineTag}</div>
                          <div className="text-[var(--psm-muted)] mt-0.5">
                            {line.fromTag} ──► {line.toTag} ({line.nominalSize}, {line.fluidService})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--psm-muted)] italic p-3 rounded-lg bg-[var(--psm-surface-2)] border border-[var(--psm-line)]">
                  {pidResult.disclaimer}
                </div>
              </div>
            ) : (
              <div className="psm-card p-12 text-center text-xs text-[var(--psm-muted)] space-y-3">
                <FileSearch className="w-10 h-10 mx-auto opacity-40 text-purple-500" />
                <p className="font-medium text-sm text-[var(--psm-fg)]">Ready for P&ID Vision Analysis</p>
                <p className="max-w-md mx-auto leading-relaxed">
                  Submit engineering drawing OCR streams or vector markups to extract candidate equipment, instruments, and relief valves into the verified Equipment Registry.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: Field Voice & Photo AI Ingestion */}
      {activeTab === 'field' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="psm-card p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-500" />
                Operator Verbal Report & Photo Intake
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--psm-muted)] font-medium mb-1">
                    Spoken Observation Transcript
                  </label>
                  <textarea
                    rows={5}
                    value={audioTranscript}
                    onChange={(e) => setAudioTranscript(e.target.value)}
                    className="psm-input w-full p-2.5 text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[var(--psm-muted)] font-medium mb-1">
                    Detected Asset Tag Hint (From Device OCR or NFC)
                  </label>
                  <input
                    type="text"
                    value={detectedTagHint}
                    onChange={(e) => setDetectedTagHint(e.target.value)}
                    className="psm-input w-full px-3 py-1.5 font-mono"
                  />
                </div>

                <button
                  onClick={() => fieldMutation.mutate()}
                  disabled={fieldMutation.isPending || !audioTranscript.trim()}
                  className="psm-button psm-button-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {fieldMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Synthesize Field Finding
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {fieldResult ? (
              <div className="psm-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--psm-line)]">
                  <div>
                    <span className="text-xs font-mono text-[var(--psm-muted)] uppercase">Draft Incident / Defect Record</span>
                    <h3 className="text-base font-bold text-[var(--psm-fg)] mt-0.5">
                      {fieldResult.observationType} on Asset {fieldResult.identifiedAssetTag}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      fieldResult.suggestedSeverity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                    }`}
                  >
                    {fieldResult.suggestedSeverity} SEVERITY
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--psm-surface-2)] border border-[var(--psm-line)] text-xs leading-relaxed text-[var(--psm-fg)]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)] mb-1">
                    Structured Professional Finding
                  </div>
                  {fieldResult.draftDescription}
                </div>

                {/* Immediate Containment Actions */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Recommended Immediate Containment
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {fieldResult.immediateContainmentActions?.map((act: string, i: number) => (
                      <li key={i} className="p-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-[var(--psm-muted)] italic pt-2 border-t border-[var(--psm-line)]">
                  {fieldResult.disclaimer}
                </div>
              </div>
            ) : (
              <div className="psm-card p-12 text-center text-xs text-[var(--psm-muted)] space-y-3">
                <Camera className="w-10 h-10 mx-auto opacity-40 text-rose-500" />
                <p className="font-medium text-sm text-[var(--psm-fg)]">Field Observation Synthesis</p>
                <p className="max-w-md mx-auto leading-relaxed">
                  Operators and technicians in hazardous process units record voice memos or photo observations. AI normalizes tags, evaluates severity, and drafts findings for supervisor sign-off.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: Read-Only Historian & Safe Limits */}
      {activeTab === 'historian' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="psm-card overflow-hidden">
              <div className="p-4 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                    Live Operational OT Telemetry Stream (Read-Only)
                  </span>
                </div>
                <button
                  onClick={() => telemetryQuery.refetch()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Poll Tags
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)] uppercase bg-[var(--psm-surface)]">
                      <th className="py-3 px-4">Telemetry Tag</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Current Value</th>
                      <th className="py-3 px-4">Normal Window</th>
                      <th className="py-3 px-4">Safe Operating Limit (SOL)</th>
                      <th className="py-3 px-4">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--psm-line)]">
                    {telemetryQuery.data?.map((t: any) => (
                      <tr
                        key={t.tag}
                        onClick={() => {
                          setSelectedTag(t.tag);
                          excursionMutation.mutate({ tag: t.tag, currentValue: t.currentValue });
                        }}
                        className={`cursor-pointer transition hover:bg-[var(--psm-surface-2)] ${
                          selectedTag === t.tag ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[var(--psm-fg)]">{t.tag}</td>
                        <td className="py-3 px-4 text-[var(--psm-muted)]">{t.description}</td>
                        <td className="py-3 px-4 font-mono font-bold text-sm">
                          {t.currentValue} {t.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--psm-muted)]">
                          {t.normalRange.min} - {t.normalRange.max} {t.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          ≤ {t.safeOperatingLimit.max} {t.unit}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              t.status === 'NORMAL'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 animate-pulse'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {excursionResult ? (
              <div className="psm-card p-5 space-y-4 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--psm-line)]">
                  <h3 className="font-semibold text-sm">Excursion Analysis & Remediation</h3>
                  <span className="font-mono text-xs font-bold">{excursionResult.tag}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 leading-relaxed">
                    {excursionResult.deviationDescription}
                  </div>
                </div>

                {excursionResult.associatedHazardScenarios?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                      Associated Hazard Scenarios
                    </span>
                    <ul className="space-y-1 text-xs">
                      {excursionResult.associatedHazardScenarios.map((scen: string, idx: number) => (
                        <li key={idx} className="p-2 rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] text-[11px]">
                          {scen}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-100">
                  <strong>Recommended Operator Response:</strong> {excursionResult.recommendedOperatorResponse}
                </div>

                <div className="text-[10px] text-[var(--psm-muted)] italic pt-1">
                  {excursionResult.disclaimer}
                </div>
              </div>
            ) : (
              <div className="psm-card p-8 text-center text-xs text-[var(--psm-muted)] space-y-2">
                <Gauge className="w-8 h-8 mx-auto text-[var(--psm-muted)] opacity-60" />
                <p>Click any telemetry tag from the read-only live table to evaluate technical excursion deviations against PSI Safe Operating Limits.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
