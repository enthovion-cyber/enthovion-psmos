import { create } from 'zustand';
import type { AiSource, ChatMessage, CopilotSession, CopilotUserPreferences } from '../types';

const STORAGE_KEY = 'enthovion_copilot_sessions_v2';
const PREFS_KEY = 'enthovion_copilot_prefs_v1';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-seed',
  role: 'assistant',
  content:
    'Welcome to **Enthovion PSM Copilot**. Ask me to trace equipment boundaries, verify isolation plans, check MOC deliverables, find HAZOP safeguards, or calculate LOPA mitigated frequencies.\n\n*All responses cite verified records and remain subject to human specialist sign-off.*',
  mode: 'ai',
  timestamp: new Date().toISOString()
};

function createInitialSession(contextModule?: string): CopilotSession {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: contextModule ? `New ${contextModule.toUpperCase()} Review` : 'New Safety Consultation',
    createdAt: now,
    updatedAt: now,
    messages: [DEFAULT_WELCOME_MESSAGE],
    contextModule: contextModule || undefined,
    isArchived: false
  };
}

function loadPersistedSessions(): CopilotSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: CopilotSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch {}
}

function loadPersistedPreferences(): CopilotUserPreferences {
  const fallback: CopilotUserPreferences = {
    density: 'comfortable',
    enterToSend: true,
    showInlineCitations: true
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

interface CopilotStoreState {
  isOpen: boolean;
  isExpanded: boolean;
  isHistoryOpen: boolean;
  isSettingsOpen: boolean;
  inspectingSource: AiSource | null;
  contextModule: string | null;
  activeSessionId: string;
  sessions: CopilotSession[];
  preferences: CopilotUserPreferences;

  // Drawer Controls
  openDrawer: (contextModule?: string) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  toggleExpanded: () => void;
  toggleHistory: () => void;
  toggleSettings: () => void;
  setInspectingSource: (src: AiSource | null) => void;

  // Active Session Messages (Convenience accessor & mutator)
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;

  // Multi-session Management
  createSession: (contextModule?: string) => string;
  switchSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  togglePinSession: (sessionId: string) => void;
  archiveSession: (sessionId: string, archive?: boolean) => void;
  deleteSession: (sessionId: string) => void;

  // Preferences
  updatePreferences: (partial: Partial<CopilotUserPreferences>) => void;
}

const initialSaved = loadPersistedSessions();
const initialSession = initialSaved[0] ?? createInitialSession();
const allInitialSessions = initialSaved.length > 0 ? initialSaved : [initialSession];

export const useCopilotStore = create<CopilotStoreState>((set, get) => ({
  isOpen: false,
  isExpanded: false,
  isHistoryOpen: false,
  isSettingsOpen: false,
  inspectingSource: null,
  contextModule: null,
  activeSessionId: initialSession.id,
  sessions: allInitialSessions,
  messages: initialSession.messages,
  preferences: loadPersistedPreferences(),

  openDrawer: (contextModule?: string) => {
    set((state) => {
      const active = state.sessions.find((s) => s.id === state.activeSessionId);
      return {
        isOpen: true,
        contextModule: contextModule || (active?.contextModule ?? null)
      };
    });
  },

  closeDrawer: () => set({ isOpen: false }),

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  setInspectingSource: (src) => set({ inspectingSource: src }),

  addMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    set((state) => {
      const updatedSessions = state.sessions.map((session) => {
        if (session.id !== state.activeSessionId) return session;

        const updatedMessages = [...session.messages, newMsg];
        // If this is the user's first query in a generic session, auto-title it
        let title = session.title;
        if (msg.role === 'user' && session.title.startsWith('New Safety')) {
          title = msg.content.slice(0, 42).trim() + (msg.content.length > 42 ? '...' : '');
        }

        return {
          ...session,
          title,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages
        };
      });

      saveSessions(updatedSessions);
      const activeSession = updatedSessions.find((s) => s.id === state.activeSessionId);
      return {
        sessions: updatedSessions,
        messages: activeSession?.messages ?? []
      };
    });
  },

  updateMessage: (id: string, content: string) => {
    set((state) => {
      const updatedSessions = state.sessions.map((session) => {
        if (session.id !== state.activeSessionId) return session;
        const updatedMessages = session.messages.map((m) =>
          m.id === id ? { ...m, content } : m
        );
        return {
          ...session,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages
        };
      });

      saveSessions(updatedSessions);
      const activeSession = updatedSessions.find((s) => s.id === state.activeSessionId);
      return {
        sessions: updatedSessions,
        messages: activeSession?.messages ?? []
      };
    });
  },

  clearMessages: () => {
    const resetMsg: ChatMessage = {
      id: `reset-${Date.now()}`,
      role: 'assistant',
      content: 'Conversation cleared. How can I assist with your process safety review?',
      mode: 'ai',
      timestamp: new Date().toISOString()
    };

    set((state) => {
      const updatedSessions = state.sessions.map((s) =>
        s.id === state.activeSessionId
          ? { ...s, messages: [resetMsg], updatedAt: new Date().toISOString() }
          : s
      );
      saveSessions(updatedSessions);
      return { sessions: updatedSessions, messages: [resetMsg] };
    });
  },

  createSession: (contextModule?: string) => {
    const newSession = createInitialSession(contextModule);
    set((state) => {
      const updatedSessions = [newSession, ...state.sessions];
      saveSessions(updatedSessions);
      return {
        sessions: updatedSessions,
        activeSessionId: newSession.id,
        messages: newSession.messages,
        contextModule: contextModule || null,
        isHistoryOpen: false
      };
    });
    return newSession.id;
  },

  switchSession: (sessionId: string) => {
    set((state) => {
      const target = state.sessions.find((s) => s.id === sessionId);
      if (!target) return state;
      return {
        activeSessionId: sessionId,
        messages: target.messages,
        contextModule: target.contextModule ?? null,
        isHistoryOpen: false
      };
    });
  },

  renameSession: (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim().slice(0, 60);
    if (!trimmed) return;
    set((state) => {
      const updatedSessions = state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title: trimmed, updatedAt: new Date().toISOString() } : s
      );
      saveSessions(updatedSessions);
      return { sessions: updatedSessions };
    });
  },

  togglePinSession: (sessionId: string) => {
    set((state) => {
      const updatedSessions = state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned, updatedAt: new Date().toISOString() } : s
      );
      saveSessions(updatedSessions);
      return { sessions: updatedSessions };
    });
  },

  archiveSession: (sessionId: string, archive = true) => {
    set((state) => {
      const updatedSessions = state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isArchived: archive, updatedAt: new Date().toISOString() } : s
      );
      saveSessions(updatedSessions);
      return { sessions: updatedSessions };
    });
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== sessionId);
      const updatedSessions = filtered.length > 0 ? filtered : [createInitialSession()];
      const nextActiveId =
        state.activeSessionId === sessionId ? updatedSessions[0]!.id : state.activeSessionId;
      const nextActive = updatedSessions.find((s) => s.id === nextActiveId)!;

      saveSessions(updatedSessions);
      return {
        sessions: updatedSessions,
        activeSessionId: nextActiveId,
        messages: nextActive.messages,
        contextModule: nextActive.contextModule ?? null
      };
    });
  },

  updatePreferences: (partial) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, ...partial };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(PREFS_KEY, JSON.stringify(nextPrefs));
        } catch {}
      }
      return { preferences: nextPrefs };
    });
  }
}));
