'use client';

import { useMemo, useState } from 'react';
import { lopaLibraryService } from '../../services/lopa-library.service';
import type { ConditionalModifierLibraryRecord } from '../../types/lopa-library.types';
import { inputClass, selectClass } from '../libraries/LibraryShared';

export function ConditionalModifierLibrarySelector({ studyId, onSelected }: { studyId: string; onSelected?: (snapshot: any) => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [appliedValue, setAppliedValue] = useState('');
  const [justification, setJustification] = useState('');
  const [records, setRecords] = useState<ConditionalModifierLibraryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selected), [records, selected]);
  const runSearch = async () => {
    setLoading(true);
    try {
      const result = await lopaLibraryService.modifierList({ search, status: 'Approved', limit: 25 });
      setRecords(result.rows);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const snapshot = await lopaLibraryService.selectModifier(studyId, {
        libraryId: selected,
        appliedValue: appliedValue === '' ? undefined : Number(appliedValue),
        engineeringJustification: justification
      });
      onSelected?.(snapshot);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="space-y-3 rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
      <div>
        <h3 className="text-sm font-black text-white">Select Conditional Modifier</h3>
        <p className="mt-1 text-xs text-slate-400">Approved modifier values are snapshotted into the study with source, range, approval status, and override justification.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
        <input className={inputClass} placeholder="Search approved modifiers..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <button onClick={runSearch} disabled={loading} className="lopa-button-secondary">{loading ? 'Searching...' : 'Search'}</button>
      </div>
      <select className={selectClass} value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Select approved modifier</option>
        {records.map((record) => <option key={record.id} value={record.id}>{record.modifier_code} - {record.modifier_name} ({record.default_value} {record.unit || 'factor'})</option>)}
      </select>
      {selectedRecord ? <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-100">Approved range: {selectedRecord.low_value ?? '-'} to {selectedRecord.high_value ?? '-'} · Override {selectedRecord.override_allowed ? 'allowed with policy controls' : 'not allowed'}.</div> : null}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input type="number" min="0" step="any" className={inputClass} placeholder="Applied value (blank uses default)" value={appliedValue} onChange={(event) => setAppliedValue(event.target.value)} />
        <input className={inputClass} placeholder="Override / selection justification" value={justification} onChange={(event) => setJustification(event.target.value)} />
      </div>
      <button onClick={save} disabled={!selected || saving} className="lopa-button-primary">{saving ? 'Snapshotting...' : 'Use Selected Modifier'}</button>
    </section>
  );
}
