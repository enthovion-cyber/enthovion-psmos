'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Edit2,
  ExternalLink,
  FileText,
  MessageSquare,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { copilotService } from '@/features/ai/services/copilot.service';
import { CopilotComposer } from '@/features/ai/components/CopilotComposer';
import { CopilotEmptyWorkspace } from '@/features/ai/components/CopilotEmptyWorkspace';
import { CopilotResponseToolbar } from '@/features/ai/components/CopilotResponseToolbar';
import { CopilotUserMessage } from '@/features/ai/components/CopilotUserMessage';
import { CopilotSynthesisLoader } from '@/features/ai/components/CopilotSynthesisLoader';
import { CopilotRecordCards } from '@/features/ai/components/CopilotRecordCards';
import { CopilotMarkdownContent } from '@/features/ai/components/CopilotMarkdownContent';
import { useCopilotStore } from '@/features/ai/stores/useCopilotStore';
import type { AiSource, ChatMessage, CopilotAnswer, CopilotAttachment } from '@/features/ai/types';
import { useSiteContext } from '@/features/workspace/context/useSiteContext';

export default function CopilotFullPage() {
  const [mounted, setMounted] = useState(false);
  const { data: tenantContext, selectedSite } = useSiteContext();
  const {
    sessions,
    activeSessionId,
    messages,
    addMessage,
    createSession,
    switchSession,
    renameSession,
    togglePinSession,
    deleteSession,
    archiveSession,
    contextModule,
    openDrawer,
    inspectingSource,
    setInspectingSource
  } = useCopilotStore();

  const [searchHistory, setSearchHistory] = useState('');
  const [historyTab, setHistoryTab] = useState<'active' | 'archived'>('active');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>(contextModule || '');
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartRename = (id: string, title: string) => {
    setEditingSessionId(id);
    setEditSessionTitle(title);
  };

  const handleSaveRename = (id: string) => {
    if (editSessionTitle.trim()) {
      renameSession(id, editSessionTitle.trim());
    }
    setEditingSessionId(null);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const currentMessages = messages || activeSession?.messages || [];

  const statusQuery = useQuery({
    queryKey: ['ai-copilot-status-full'],
    queryFn: copilotService.getStatus,
    staleTime: 60_000
  });

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    askMutation.reset();
  };

  useEffect(() => {
    handleCancelRequest();
  }, [activeSessionId]);

  const askMutation = useMutation({
    mutationFn: (q: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsSending(true);
      return copilotService.ask(q, selectedModule || undefined, controller.signal);
    },
    onSuccess: (data: CopilotAnswer) => {
      setIsSending(false);
      abortControllerRef.current = null;
      addMessage({
        role: 'assistant',
        content: data.answer,
        mode: data.mode,
        sources: data.sources,
        uncertainties: data.uncertainties,
        validation: data.validation,
        structuredCards: data.structuredCards,
        contextModule: selectedModule || undefined
      });
    },
    onError: (err: any) => {
      setIsSending(false);
      abortControllerRef.current = null;
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      addMessage({
        role: 'assistant',
        content: `Error contacting Process Safety Copilot: ${
          err?.response?.data?.message || err?.message || 'Service unreachable'
        }. Verify network connectivity and user permissions.`,
        mode: 'extractive-fallback'
      });
    }
  });

  const lastMsg = currentMessages[currentMessages.length - 1];
  const isPending = isSending && lastMsg?.role === 'user';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isPending]);

  const handleSendMessage = (text: string, attachment?: CopilotAttachment) => {
    const query = text.trim();
    if (!query || isSending) return;

    let userContent = query;
    if (attachment) {
      userContent = `[Attached Document: ${attachment.name}]\n\n${query}`;
    }

    addMessage({
      role: 'user',
      content: userContent
    });
    askMutation.mutate(query);
  };

  const filteredSessions = sessions
    .filter((s) => {
      const isArchived = Boolean(s.isArchived);
      if (historyTab === 'active' && isArchived) return false;
      if (historyTab === 'archived' && !isArchived) return false;
      if (!searchHistory.trim()) return true;
      return s.title.toLowerCase().includes(searchHistory.toLowerCase());
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const activeCompany =
    tenantContext?.companies?.find((c) => c.id === tenantContext.activeCompanyId) ||
    tenantContext?.companies?.[0];
  const companyName = activeCompany?.name || 'Enthovion Industrial';
  const siteName = selectedSite?.name || 'Active Site Facility';
  const isOnlyWelcome = currentMessages.length <= 1 && currentMessages[0]?.id === 'welcome-seed';

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-8.5rem)] rounded-xl border border-slate-800 bg-[#070c18] items-center justify-center text-slate-500">
        <Sparkles className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-xl border border-slate-800 bg-[#070c18] overflow-hidden shadow-2xl">
      {/* 1. LEFT SIDEBAR: SESSIONS & CONTEXT */}
      <aside className="w-72 shrink-0 border-r border-slate-800 bg-[#0a1120] flex flex-col hidden md:flex">
        {/* New Session Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => createSession(selectedModule || undefined)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>

        {/* History Search & Tabs */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0d1628] focus-within:border-blue-500 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 text-xs font-medium border-b border-slate-800 pb-1">
            <button
              type="button"
              onClick={() => setHistoryTab('active')}
              className={`pb-1 px-1 transition border-b-2 cursor-pointer ${
                historyTab === 'active'
                  ? 'border-blue-400 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({sessions.filter((s) => !s.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('archived')}
              className={`pb-1 px-1 transition border-b-2 cursor-pointer ${
                historyTab === 'archived'
                  ? 'border-blue-400 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Archived ({sessions.filter((s) => s.isArchived).length})
            </button>
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
              <MessageSquare className="w-5 h-5 mx-auto opacity-30" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEditing = editingSessionId === s.id;

              return (
                <div
                  key={s.id}
                  className={`group p-2.5 rounded-lg border text-xs transition flex items-center justify-between gap-2 ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-950/30'
                      : 'border-transparent hover:border-slate-800 hover:bg-[#0d1628]'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editSessionTitle}
                        onChange={(e) => setEditSessionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(s.id);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        className="flex-1 bg-[#0d1628] border border-slate-700 rounded px-1.5 py-1 text-xs outline-none text-slate-100"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(s.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded cursor-pointer"
                        title="Save rename"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => switchSession(s.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                        {s.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{s.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                        {s.contextModule && (
                          <span className="uppercase font-mono text-[9px] px-1 bg-[#0d1628] border border-slate-800 rounded text-slate-400">
                            {s.contextModule}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
                      {/* Pin Button */}
                      <button
                        type="button"
                        onClick={() => togglePinSession(s.id)}
                        className={`p-1 rounded cursor-pointer transition ${
                          s.isPinned
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'hover:text-slate-200 hover:bg-slate-800 opacity-60 hover:opacity-100'
                        }`}
                        title={s.isPinned ? 'Unpin consultation' : 'Pin to top'}
                        aria-label="Pin consultation"
                      >
                        <Pin className={`w-3.5 h-3.5 ${s.isPinned ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Edit (Rename) Button */}
                      <button
                        type="button"
                        onClick={() => handleStartRename(s.id, s.title)}
                        className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                        title="Rename consultation"
                        aria-label="Rename consultation"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      {/* Archive Button */}
                      <button
                        type="button"
                        onClick={() => archiveSession(s.id, !s.isArchived)}
                        className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                        title={s.isArchived ? 'Restore' : 'Archive'}
                        aria-label="Archive consultation"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="p-1 hover:text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                        title="Delete consultation"
                        aria-label="Delete consultation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Safety Boundary Strip */}
        <div className="p-3 border-t border-slate-800 bg-[#080e1a] text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Tenant Boundary</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Queries scoped to {siteName}. All recommendations require licensed sign-off.
          </p>
        </div>
      </aside>

      {/* 2. MAIN CENTER CONVERSATION AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070c18]">
        {/* Top Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#0a1120] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40 shadow-xs shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
                  PSM Copilot — Industrial AI Workspace
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {statusQuery.data?.model || 'gpt-4o'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Scope: {companyName} / <strong className="text-blue-400">{siteName}</strong></span>
                {selectedModule && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-[#0d1628] border border-slate-700 text-indigo-400">
                    {selectedModule}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Module Scope Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Module Scope:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-[#0d1628] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All PSM Modules</option>
              <option value="ptw">Permits & SIMOPS (PTW)</option>
              <option value="moc">Management of Change (MOC)</option>
              <option value="pssr">Pre-Startup Safety Review (PSSR)</option>
              <option value="psi">Process Safety Info (PSI)</option>
              <option value="hazop">Hazard & Operability (HAZOP)</option>
              <option value="lopa">Layers of Protection (LOPA)</option>
              <option value="incidents">Incident Investigation</option>
            </select>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isOnlyWelcome ? (
            <div className="max-w-3xl mx-auto py-6">
              <CopilotEmptyWorkspace
                onSelectPrompt={(p) => handleSendMessage(p)}
                contextModule={selectedModule || undefined}
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {currentMessages.map((msg: ChatMessage) => {
                const isUser = msg.role === 'user';
                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <CopilotUserMessage
                        message={msg}
                        onResend={(text) => handleSendMessage(text)}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className="flex flex-col items-start animate-in fade-in duration-150"
                  >
                    <div className="max-w-[92%] w-full leading-relaxed transition-all bg-[#0d1628] text-slate-100 border border-slate-800/90 rounded-2xl rounded-tl-xs p-4 shadow-sm">
                      {/* Rich Executive Record Cards (PTW, MOC, PSSR, Incident, Equipment) */}
                      {msg.structuredCards && msg.structuredCards.length > 0 && (
                        <CopilotRecordCards cards={msg.structuredCards} />
                      )}

                      {/* Message Content */}
                      <CopilotMarkdownContent content={msg.content} />

                      {/* Uncertainties & Injections Warnings */}
                      {msg.uncertainties && msg.uncertainties.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-amber-900/50 space-y-1">
                          {msg.uncertainties.map((u: string, i: number) => (
                            <div
                              key={i}
                              className="text-xs text-amber-300 flex items-start gap-1.5"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                              <span>{u}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Verified Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Verified Citations ({msg.sources.length})</span>
                            {msg.validation?.valid && (
                              <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Validated
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((s: AiSource) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setInspectingSource(s)}
                                className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/90 hover:border-blue-500/50 text-left transition flex items-start justify-between gap-2 group cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[11px] text-blue-400">
                                      [{s.id}]
                                    </span>
                                    <span className="font-medium text-xs text-slate-200 group-hover:text-blue-400 truncate">
                                      {s.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {s.snippet}
                                  </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-transform" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Action Toolbar */}
                      <CopilotResponseToolbar
                        content={msg.content}
                        sources={msg.sources}
                        onOpenSource={(s) => setInspectingSource(s)}
                      />
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                );
              })}

              {/* Progress Loading Indicator */}
              {isPending && (
                <div className="flex justify-start">
                  <CopilotSynthesisLoader onCancel={handleCancelRequest} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="max-w-4xl w-full mx-auto">
          <CopilotComposer
            onSend={handleSendMessage}
            isPending={isPending}
            onCancel={handleCancelRequest}
          />
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR: EVIDENCE INSPECTOR (WHEN ACTIVE) */}
      {inspectingSource && (
        <aside className="w-80 shrink-0 border-l border-slate-800 bg-[#0a1120] flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Evidence Inspector
              </h3>
              <span className="font-mono text-xs font-bold text-blue-400">
                [{inspectingSource.id}]
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInspectingSource(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-950/60 text-blue-300 border border-blue-800">
                  {inspectingSource.recordType}
                </span>
                {inspectingSource.status && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {inspectingSource.status}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                {inspectingSource.title}
              </h4>
              <div className="text-[11px] font-mono text-slate-500">
                ID: {inspectingSource.recordId}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Verified Extracted Evidence
              </span>
              <div className="p-3 rounded-lg bg-[#0d1628] border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                {inspectingSource.snippet}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Authoritative record retrieved via pgvector search.</span>
              </div>

              {inspectingSource.url ? (
                <Link
                  href={inspectingSource.url}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-xs cursor-pointer"
                >
                  <span>Open Authoritative Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div className="p-2.5 rounded bg-[#0d1628] border border-slate-800 text-[11px] text-slate-500 text-center">
                  Direct deep link unavailable in this module context.
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
