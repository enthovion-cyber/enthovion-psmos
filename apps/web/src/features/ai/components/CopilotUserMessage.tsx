'use client';

import { useState } from 'react';
import { Bookmark, Check, Copy, Edit3, Send, X } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { ChatMessage } from '../types';

interface CopilotUserMessageProps {
  message: ChatMessage;
  onResend?: (text: string) => void;
}

export function CopilotUserMessage({ message, onResend }: CopilotUserMessageProps) {
  const toast = useMutationToast();
  const { updateMessage } = useCopilotStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Prompt Copied', 'Engineering prompt copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy Failed', 'Unable to access clipboard.');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(
      !isSaved ? 'Prompt Saved' : 'Prompt Removed',
      !isSaved
        ? 'Inquiry added to your saved engineering consultations.'
        : 'Inquiry removed from saved consultations.'
    );
  };

  const handleSaveEditOnly = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    updateMessage(message.id, trimmed);
    setIsEditing(false);
    toast.success('Prompt Updated', 'Saved revised inquiry text.');
  };

  const handleSaveAndResend = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    updateMessage(message.id, trimmed);
    setIsEditing(false);
    if (onResend) {
      onResend(trimmed);
    }
  };

  return (
    <div className="flex flex-col items-end group animate-in fade-in duration-150 max-w-[92%] sm:max-w-[85%]">
      {isEditing ? (
        <div className="w-full bg-[#0d1628] border border-blue-500/80 rounded-2xl rounded-tr-xs p-3 shadow-lg space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={Math.min(6, Math.max(2, editText.split('\n').length))}
            className="w-full bg-[#070c18] text-slate-100 border border-slate-700 rounded-lg p-2.5 text-xs outline-none resize-none leading-relaxed focus:border-blue-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setEditText(message.content);
                setIsEditing(false);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEditOnly}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndResend}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Save & Resend</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-md leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
          {message.content}
        </div>
      )}

      {/* Action Bar (Edit / Copy / Save + Timestamp) */}
      <div className="flex items-center gap-2 mt-1 px-1 select-none">
        <span className="text-[10px] text-slate-500 font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>

        {!isEditing && (
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                setEditText(message.content);
                setIsEditing(true);
              }}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition flex items-center gap-1 cursor-pointer"
              title="Edit Prompt"
              aria-label="Edit Prompt"
            >
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px]">Edit</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition flex items-center gap-1 cursor-pointer"
              title="Copy Prompt"
              aria-label="Copy Prompt"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                isSaved
                  ? 'text-amber-400 bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
              title={isSaved ? 'Prompt Saved' : 'Save / Bookmark Prompt'}
              aria-label="Save Prompt"
            >
              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="text-[10px]">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
