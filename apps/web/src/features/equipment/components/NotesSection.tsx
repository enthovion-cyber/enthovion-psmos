'use client';

import { useState } from 'react';
import { MessageSquarePlus, Pencil, Trash2, Plus } from 'lucide-react';
import type { EquipmentNote } from '@/services/equipment.service';

export function NotesSection({ 
  notes, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  notes: EquipmentNote[]; 
  onAdd: (body: string) => void; 
  onEdit: (id: string, body: string) => void; 
  onDelete: (id: string) => void 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  // Helper to extract clean user initials for the avatar (e.g., "Ahmed Khan" -> "AK")
  const getInitials = (name?: string | null) => {
    if (!name) return 'SYS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to format date matching the mockup look (e.g., "21 May 2025 10:30 AM")
  const formatNoteDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="psm-card rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] overflow-hidden">
      
      {/* Mockup Header Style */}
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Notes</h2>
        <button 
          type="button" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs font-semibold text-info hover:underline bg-transparent border-0 cursor-pointer"
        >
          <Plus size={14} /> Add Note
        </button>
      </div>

      {/* Conditionally Displayed Add Form */}
      {showAddForm && (
        <div className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <form 
            onSubmit={(event) => { 
              event.preventDefault(); 
              if (body.trim()) { 
                onAdd(body.trim()); 
                setBody(''); 
                setShowAddForm(false);
              } 
            }} 
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input 
              value={body} 
              onChange={(event) => setBody(event.target.value)} 
              className="psm-input min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)]" 
              placeholder="Write a note..." 
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button type="submit" className="psm-button psm-button-primary flex items-center gap-1 text-xs px-3 py-2 rounded-lg">
                <MessageSquarePlus size={14} /> Add
              </button>
              <button type="button" onClick={() => { setBody(''); setShowAddForm(false); }} className="psm-button psm-button-secondary text-xs px-3 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List Content */}
      <div className="divide-y divide-[var(--psm-line)]">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--psm-muted)]">
            No notes yet. Click "+ Add Note" to create one.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 text-sm bg-[var(--psm-surface)] transition-colors hover:bg-[var(--psm-surface-2)]/30">
              {editing === note.id ? (
                <div className="space-y-2">
                  <textarea 
                    value={editBody} 
                    onChange={(event) => setEditBody(event.target.value)} 
                    className="psm-input min-h-20 w-full p-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-sm" 
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { onEdit(note.id, editBody); setEditing(null); }} className="psm-button psm-button-primary min-h-8 text-xs px-3 rounded-lg">Save</button>
                    <button type="button" onClick={() => setEditing(null)} className="psm-button psm-button-secondary min-h-8 text-xs px-3 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Top Header Layer: Avatar, Author, Timestamp, Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Stylized Circle Initial Avatar */}
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-info/10 border border-info/20 text-[10px] font-bold text-info tracking-wider">
                        {getInitials(note.authorName ?? note.authorId)}
                      </div>
                      <span className="font-semibold text-white truncate">
                        {note.authorName ?? note.authorId ?? 'System'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[var(--psm-muted)] font-medium">
                        {formatNoteDate(note.createdAt)}
                        {note.updatedAt !== note.createdAt && ' (Edited)'}
                      </span>
                      
                      {/* Action Triggers */}
                      <div className="flex items-center ml-1 border-l border-[var(--psm-line)] pl-1.5 gap-0.5">
                        <button 
                          onClick={() => { setEditing(note.id); setEditBody(note.body); }} 
                          className="rounded-md p-1 text-[var(--psm-muted)] hover:text-info hover:bg-[var(--psm-surface-3)] transition-colors" 
                          aria-label="Edit note"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => onDelete(note.id)} 
                          className="rounded-md p-1 text-[var(--psm-muted)] hover:text-danger hover:bg-danger/10 transition-colors" 
                          aria-label="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Body Text Row */}
                  <div className="pl-9 pr-2 text-xs sm:text-sm text-[var(--psm-text)] leading-relaxed font-normal opacity-95 break-words">
                    {note.body}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}