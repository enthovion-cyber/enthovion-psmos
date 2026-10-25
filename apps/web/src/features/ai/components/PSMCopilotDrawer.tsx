'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { copilotService } from '../services/copilot.service';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { AiSource, ChatMessage, CopilotAttachment } from '../types';
import { CopilotHeader } from './CopilotHeader';
import { CopilotContextBar } from './CopilotContextBar';
import { CopilotEmptyWorkspace } from './CopilotEmptyWorkspace';
import { CopilotEvidenceInspector } from './CopilotEvidenceInspector';
import { CopilotHistorySidebar } from './CopilotHistorySidebar';
import { CopilotSettingsModal } from './CopilotSettingsModal';
import { CopilotComposer } from './CopilotComposer';
import { CopilotResponseToolbar } from './CopilotResponseToolbar';
import { CopilotUserMessage } from './CopilotUserMessage';
import { CopilotSynthesisLoader } from './CopilotSynthesisLoader';
import { CopilotRecordCards } from './CopilotRecordCards';
import { CopilotMarkdownContent } from './CopilotMarkdownContent';

export function PSMCopilotDrawer() {
  const {
    isOpen,
    isExpanded,
    closeDrawer,
    contextModule,
    messages,
    addMessage,
    sessions,
    activeSessionId,
    preferences,
    setInspectingSource
  } = useCopilotStore();

  const [mounted, setMounted] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeTitle = activeSession?.title || 'Industrial Process Safety Workspace';

  const statusQuery = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: copilotService.getStatus,
    enabled: isOpen
  });

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    askMutation.reset();
  };

  // Automatically cancel any in-flight loading state if the user switches/creates a session or closes the drawer
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
      return copilotService.ask(q, contextModule || undefined, controller.signal);
    },
    onSuccess: (data) => {
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
        contextModule: contextModule || undefined
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
          err?.response?.data?.message || err.message || 'Service unreachable'
        }. You can still navigate records directly using global search or retry below.`,
        mode: 'extractive-fallback'
      });
    }
  });

  // Smooth scroll to bottom on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  // Escape key handler to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  const handleSendMessage = (text: string, attachment?: CopilotAttachment) => {
    const query = text.trim();
    if (!query || isSending) return;

    let userContent = query;
    if (attachment) {
      userContent = `[Attached Document: ${attachment.name}]\n\n${query}`;
    }

    setLastQuery(query);
    addMessage({
      role: 'user',
      content: userContent
    });
    askMutation.mutate(query);
  };

  const handleRetry = () => {
    if (lastQuery && !isSending) {
      askMutation.mutate(lastQuery);
    }
  };

  if (!mounted || !isOpen) return null;

  const lastMsg = messages[messages.length - 1];
  const isPending = isSending && lastMsg?.role === 'user';
  const isDensityCompact = preferences.density === 'compact';
  const isOnlyWelcome = messages.length <= 1 && messages[0]?.id === 'welcome-seed';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Dim Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 pointer-events-auto"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Root Aside */}
      <aside
        className={`absolute inset-y-0 right-0 flex flex-col bg-[#070c18] border-l border-slate-800/90 shadow-2xl transition-all duration-200 pointer-events-auto overflow-hidden ${
          isExpanded ? 'w-full md:w-[860px]' : 'w-full md:w-[520px]'
        }`}
        role="dialog"
        aria-label="Enthovion Process Safety Copilot Workspace"
      >
        {/* 1. Header Toolbar */}
        <CopilotHeader status={statusQuery.data} activeTitle={activeTitle} />

        {/* 2. Active Context & Scope Controls */}
        <CopilotContextBar />

        {/* 3. Sliding Sub-Panels (History, Evidence Inspector, Settings) */}
        <CopilotHistorySidebar />
        <CopilotEvidenceInspector />
        <CopilotSettingsModal />

        {/* 4. Conversation & Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isOnlyWelcome ? (
            <CopilotEmptyWorkspace
              onSelectPrompt={(p) => handleSendMessage(p)}
              contextModule={contextModule}
            />
          ) : (
            <div className={`space-y-4 ${isDensityCompact ? 'text-xs' : 'text-sm'}`}>
              {messages.map((msg) => {
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
                    <div className="max-w-[95%] w-full leading-relaxed transition-all bg-[#0d1628] text-slate-100 border border-slate-800/90 rounded-2xl rounded-tl-xs p-4 shadow-sm">
                      {/* Rich Executive Record Cards (PTW, MOC, PSSR, Incident, Equipment) */}
                      {msg.structuredCards && msg.structuredCards.length > 0 && (
                        <CopilotRecordCards cards={msg.structuredCards} />
                      )}

                      {/* Message Content */}
                      <CopilotMarkdownContent content={msg.content} />

                      {/* Uncertainties & Injections Warnings */}
                      {msg.uncertainties && msg.uncertainties.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-amber-900/50 space-y-1">
                          {msg.uncertainties.map((u, i) => (
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

                      {/* Verified Citations & Evidence Pills */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Verified Citations ({msg.sources.length})</span>
                            {msg.validation?.valid && (
                              <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Validated
                              </span>
                            )}
                          </div>

                          {preferences.showInlineCitations ? (
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.sources.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setInspectingSource(s)}
                                  className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800/90 hover:border-blue-500/50 text-left transition flex items-start justify-between gap-2 group w-full cursor-pointer"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[11px] text-blue-400">
                                        [{s.id}]
                                      </span>
                                      <span className="font-medium text-xs text-slate-200 group-hover:text-blue-400 truncate">
                                        {s.title}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-850 text-slate-400 border border-slate-800">
                                        {s.recordType}
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
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setInspectingSource(s)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-[#070c18] border border-slate-800 hover:border-blue-500 text-blue-400 transition cursor-pointer"
                                >
                                  <span>[{s.id}]</span>
                                  <span className="max-w-[120px] truncate">{s.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
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

              {/* Failed Error Recovery Banner */}
              {askMutation.isError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/80 text-xs text-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Inquiry failed. Extractive fail-safe records are still available.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center gap-1 font-semibold text-xs text-rose-700 dark:text-rose-300 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 5. Persistent Message Composer */}
        <CopilotComposer
          onSend={handleSendMessage}
          isPending={isPending}
          onCancel={handleCancelRequest}
        />
      </aside>
    </div>
  );
}
