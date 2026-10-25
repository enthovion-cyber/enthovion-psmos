'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Square,
  X
} from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useCopilotStore } from '../stores/useCopilotStore';
import type { CopilotAttachment } from '../types';

interface CopilotComposerProps {
  onSend: (text: string, attachment?: CopilotAttachment) => void;
  isPending: boolean;
  onCancel?: (() => void) | undefined;
}

export function CopilotComposer({ onSend, isPending, onCancel }: CopilotComposerProps) {
  const toast = useMutationToast();
  const { preferences } = useCopilotStore();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<CopilotAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = text.trim();
    if (!query || isPending) return;

    onSend(query, attachment ?? undefined);
    setText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (preferences.enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security & payload bound check: 5 MB limit
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error('File Too Large', 'Maximum permissible engineering attachment is 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setAttachment({
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadStatus: 'ready'
    });
    toast.success('Document Attached', `${file.name} ready for contextual analysis.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // Web Speech API browser check
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        'Speech Recognition Unavailable',
        'Your browser does not support local speech-to-text. Type your engineering inquiry directly.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript)
          .join('');
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error('Microphone Error', 'Voice input was interrupted or permission was denied.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      toast.error('Microphone Access Error', 'Unable to initialize audio capture.');
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > 1500;

  return (
    <div className="p-3 border-t border-slate-800/80 bg-[#0a1120]">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="mb-2 p-2 rounded-lg bg-[#0d1628] border border-slate-700/60 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded bg-blue-950/80 text-blue-400 border border-blue-800/50">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-slate-200 truncate max-w-[200px]">
              {attachment.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              ({(attachment.size / 1024).toFixed(0)} KB)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Multiline Composer Container */}
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex flex-col rounded-xl border border-slate-700/60 bg-[#0d1628] focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/40 transition shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot about process safety, equipment limits, or MOC deliverables..."
            disabled={isPending}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-xs sm:text-sm outline-none resize-none min-h-[42px] max-h-[140px] leading-relaxed text-slate-100 placeholder:text-slate-500"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="p-1.5 rounded-md hover:bg-slate-800 hover:text-slate-200 transition text-slate-400 disabled:opacity-40 cursor-pointer"
                title="Attach Engineering Document or Drawing (max 5 MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isPending}
                className={`p-1.5 rounded-md transition disabled:opacity-40 cursor-pointer ${
                  isRecording
                    ? 'text-rose-400 bg-rose-950/60 animate-pulse'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={isRecording ? 'Stop Recording' : 'Voice Input (Preview before sending)'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isRecording && (
                <span className="text-[10px] font-medium text-rose-400 animate-pulse">
                  Listening...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono ${
                  isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {charCount}/1500
              </span>

              {isPending && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition cursor-pointer"
                  title="Cancel Request"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  disabled={!text.trim() || isPending || isOverLimit}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    !text.trim() || isPending || isOverLimit
                      ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-900/30'
                  }`}
                  title="Send (Enter)"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
