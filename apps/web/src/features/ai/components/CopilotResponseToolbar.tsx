'use client';

import { useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { AiSource } from '../types';

interface CopilotResponseToolbarProps {
  content: string;
  sources?: AiSource[] | undefined;
  onOpenSource?: ((src: AiSource) => void) | undefined;
}

export function CopilotResponseToolbar({ content, sources, onOpenSource }: CopilotResponseToolbarProps) {
  const toast = useMutationToast();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<'helpful' | 'unhelpful' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Response Copied', 'Engineering response copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy Failed', 'Unable to access system clipboard.');
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(
      !saved ? 'Response Saved' : 'Response Removed',
      !saved
        ? 'Response bookmarked in saved consultations.'
        : 'Response removed from bookmarks.'
    );
  };

  const handleExport = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psm-copilot-report-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report Exported', 'Downloaded Markdown document.');
    } catch {
      toast.error('Export Failed', 'Could not generate report file.');
    }
  };

  const handleFeedback = (rating: 'helpful' | 'unhelpful') => {
    setFeedback(rating);
    toast.success(
      'Feedback Recorded',
      rating === 'helpful'
        ? 'Thank you for confirming this engineering response.'
        : 'Thank you. Negative feedback is flagged for PSM knowledge base review.'
    );
  };

  return (
    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 select-none">
      {/* Source Count & Action */}
      <div className="flex items-center gap-1.5">
        {sources && sources.length > 0 && (
          <span className="font-mono text-[10px] text-blue-400 font-medium">
            {sources.length} cited source(s)
          </span>
        )}
      </div>

      {/* Toolbar Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-slate-800 hover:text-slate-100 transition flex items-center gap-1 cursor-pointer"
          title="Copy Response"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className={`p-1 rounded transition flex items-center gap-1 cursor-pointer ${
            saved ? 'text-amber-400 bg-amber-950/40' : 'hover:bg-slate-800 hover:text-slate-100'
          }`}
          title={saved ? 'Response Saved' : 'Save Response to Consultations'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-amber-400' : ''}`} />
          <span className="text-[10px] hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="p-1 rounded hover:bg-slate-800 hover:text-slate-100 transition flex items-center gap-1 cursor-pointer"
          title="Export as Markdown"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">Export</span>
        </button>

        <div className="w-px h-3 bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => handleFeedback('helpful')}
          className={`p-1 rounded transition cursor-pointer ${
            feedback === 'helpful' ? 'text-emerald-400 bg-emerald-950/40' : 'hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Helpful Response"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleFeedback('unhelpful')}
          className={`p-1 rounded transition cursor-pointer ${
            feedback === 'unhelpful' ? 'text-rose-400 bg-rose-950/40' : 'hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Needs Improvement / Inaccurate"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
