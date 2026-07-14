'use client';

import { useMemo, useState } from 'react';
import { lopaLibraryService } from '../../services/lopa-library.service';
import type { InitiatingEventLibraryRecord } from '../../types/lopa-library.types';
import { inputClass, selectClass } from '../libraries/LibraryShared';

export function InitiatingEventLibrarySelector({ studyId, onSelected }: { studyId: string; onSelected?: (snapshot: any) => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [siteModifier, setSiteModifier] = useState('1');
  const [justification, setJustification] = useState('');
  const [records, setRecords] = useState<InitiatingEventLibraryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedRecord = useMemo(() => records.find((record) => record.id === selected), [records, selected]);
  const runSearch = async () => {
    setLoading(true);
    try {
      const result = await lopaLibraryService.initiatingList({ search, status: 'Approved', limit: 25 });
      setRecords(result.rows);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const snapshot = await lopaLibraryService.selectInitiatingEvent(studyId, {
        libraryId: selected,
        siteModifier: Number(siteModifier || 1),
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
        <h3 className="text-sm font-black text-white">Select Initiating Event from Library</h3>
        <p className="mt-1 text-xs text-slate-400">Approved library values are snapshotted into the LOPA study with source reference, range, revision, and selected modifier.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
        <input className={inputClass} placeholder="Search approved initiating events..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <button onClick={runSearch} disabled={loading} className="lopa-button-secondary">{loading ? 'Searching...' : 'Search'}</button>
      </div>
      <select className={selectClass} value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Select approved initiating event</option>
        {records.map((record) => <option key={record.id} value={record.id}>{record.event_code} - {record.event_name} ({Number(record.base_frequency).toExponential(2)} {record.frequency_unit})</option>)}
      </select>
      {selectedRecord ? <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">Selected value will be snapshotted from revision {selectedRecord.revision}. If the library record changes later, this study keeps the old snapshot until you sync/select again.</div> : null}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input type="number" min="0" step="any" className={inputClass} placeholder="Site modifier" value={siteModifier} onChange={(event) => setSiteModifier(event.target.value)} />
        <input className={inputClass} placeholder="Engineering justification / basis" value={justification} onChange={(event) => setJustification(event.target.value)} />
      </div>
      <button onClick={save} disabled={!selected || saving} className="lopa-button-primary">{saving ? 'Snapshotting...' : 'Use Selected Initiating Event'}</button>
    </section>
  );
}
