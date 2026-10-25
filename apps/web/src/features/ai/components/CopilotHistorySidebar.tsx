'use client';

import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Check,
  Edit2,
  History,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { CopilotSession } from '../types';

export function CopilotHistorySidebar() {
  const {
    isHistoryOpen,
    toggleHistory,
    sessions,
    activeSessionId,
    switchSession,
    createSession,
    renameSession,
    togglePinSession,
    archiveSession,
    deleteSession
  } = useCopilotStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isHistoryOpen) return null;

  const filteredSessions = sessions
    .filter((s) => {
      const isArchived = Boolean(s.isArchived);
      if (tab === 'active' && isArchived) return false;
      if (tab === 'archived' && !isArchived) return false;
      if (!searchQuery.trim()) return true;
      return s.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleStartRename = (s: CopilotSession) => {
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="absolute inset-y-0 left-0 w-full sm:w-[320px] bg-[#070c18] border-r border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0a1120]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Consultation History
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => createSession()}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Start New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleHistory}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Close History"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-[#0a1120]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0d1628] focus-within:border-blue-500 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search past conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="flex gap-2 text-xs font-medium border-b border-slate-800 pb-1">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`pb-1 px-1 transition border-b-2 cursor-pointer ${
              tab === 'active'
                ? 'border-blue-400 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({sessions.filter((s) => !s.isArchived).length})
          </button>
          <button
            type="button"
            onClick={() => setTab('archived')}
            className={`pb-1 px-1 transition border-b-2 cursor-pointer ${
              tab === 'archived'
                ? 'border-blue-400 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Archived ({sessions.filter((s) => s.isArchived).length})
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto opacity-30" />
            <p>No conversations found.</p>
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const isEditing = editingId === s.id;

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
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(s.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 bg-[#0d1628] border border-slate-700 rounded px-1.5 py-1 text-xs outline-none text-slate-100"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(s.id)}
                      className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded cursor-pointer"
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

                {/* Session Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
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
                      <Pin className={`w-3 h-3 ${s.isPinned ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartRename(s)}
                      className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                      title="Rename"
                      aria-label="Rename consultation"
                    >
                      <Edit2 className="w-3 h-3 text-blue-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveSession(s.id, !s.isArchived)}
                      className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                      title={s.isArchived ? 'Restore' : 'Archive'}
                      aria-label="Archive consultation"
                    >
                      {s.isArchived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="p-1 hover:text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer transition opacity-70 hover:opacity-100"
                      title="Delete"
                      aria-label="Delete consultation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Permanent Deletion */}
      {confirmDeleteId && (
        <div className="absolute inset-0 bg-black/70 z-50 p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div className="bg-[#0a1120] border border-slate-800 rounded-xl p-4 space-y-3 max-w-xs shadow-2xl">
            <h4 className="font-semibold text-xs text-slate-100">Delete Conversation?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This will permanently delete this conversation and its local cached session.
            </p>
            <div className="flex justify-end gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-2.5 py-1 rounded border border-slate-800 text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSession(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
