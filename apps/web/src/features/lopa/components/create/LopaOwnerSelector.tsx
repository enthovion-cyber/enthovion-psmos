'use client';

import { AlertTriangle, CheckCircle2, Loader2, Search, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLopaCreateOwnerProfile, useLopaCreateTeamSuggestions, useLopaCreateUserSearch } from '../../hooks/useLopa';
import type { LopaOwnerProfile } from '../../types/lopa.types';

type Props = {
  value?: string;
  onChange: (ownerId: string) => void;
  users?: LopaOwnerProfile[];
  siteId?: string;
  unitId?: string;
  areaId?: string;
  hazopScenarioId?: string;
  facilitatorId?: string;
  compact?: boolean;
};

export function LopaOwnerSelector({ value, onChange, users = [], siteId, unitId, areaId, hazopScenarioId, facilitatorId, compact = false }: Props) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const suggestions = useLopaCreateTeamSuggestions({ hazopScenarioId, siteId, ownerId: value, facilitatorId });
  const results = useLopaCreateUserSearch(search, siteId, unitId, areaId);
  const profile = useLopaCreateOwnerProfile(value, { siteId, unitId, areaId });

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(input.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [input]);

  const candidates = useMemo(() => {
    const rows = new Map<string, LopaOwnerProfile>();
    const add = (row: any, reasons: string[] = []) => {
      const id = row?.userId ?? row?.id;
      if (!id) return;
      const current = rows.get(id);
      rows.set(id, {
        ...(current ?? {}),
        ...row,
        id,
        userId: id,
        displayName: row.displayName ?? row.fullName ?? row.email ?? current?.displayName ?? 'Unknown user',
        fullName: row.fullName ?? row.displayName ?? row.email ?? current?.fullName ?? 'Unknown user',
        suggestionReasons: [...new Set([...(current?.suggestionReasons ?? []), ...(row.suggestionReasons ?? []), ...reasons])]
      } as LopaOwnerProfile);
    };
    users.forEach((row) => add(row));
    (suggestions.data?.rows ?? []).forEach((row: any) => add(row, row.suggestionReasons ?? ['Team suggestion']));
    (results.data ?? []).forEach((row) => add(row));
    return [...rows.values()];
  }, [results.data, suggestions.data?.rows, users]);

  const selected = profile.data ?? candidates.find((candidate) => candidate.id === value || candidate.userId === value);
  const suggested = candidates.filter((candidate) => (candidate.suggestionReasons?.length ?? 0) > 0).slice(0, 5);
  const searchable = input.trim().length >= 2 ? candidates : [];
  const canUse = (candidate?: LopaOwnerProfile) => candidate?.active !== false && candidate?.validation?.valid !== false;

  return (
    <section className="rounded-xl border border-cyan-300/15 bg-white p-4 text-slate-900 shadow-sm dark:bg-[#03101d] dark:text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2 font-bold"><UserRound size={16} className="text-cyan-600 dark:text-cyan-300" /> Study Owner <span className="text-red-500">*</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select an active IAM user with access to this study location.</p></div>
        {profile.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-cyan-500" /> : null}
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search name, email, role, department..." className="w-full rounded-lg border border-cyan-300/20 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 dark:bg-[#06111f]" />
      </div>
      {input.trim().length >= 2 ? <div className="mt-2 max-h-52 space-y-1 overflow-auto rounded-lg border border-cyan-300/10 p-1">{results.isFetching ? <div className="px-3 py-2 text-sm text-slate-500">Searching IAM users...</div> : null}{searchable.map((candidate) => <OwnerOption key={candidate.id} candidate={candidate} selected={candidate.id === value} disabled={!canUse(candidate)} onSelect={onChange} />)}{!results.isFetching && !searchable.length ? <div className="px-3 py-2 text-sm text-slate-500">No matching users found.</div> : null}</div> : null}
      {!input.trim() && suggested.length ? <div className="mt-3"><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested Owners</div><div className="space-y-1">{suggested.map((candidate) => <OwnerOption key={candidate.id} candidate={candidate} selected={candidate.id === value} disabled={!canUse(candidate)} onSelect={onChange} />)}</div></div> : null}
      {profile.isError ? <div className="mt-3 flex gap-2 rounded-lg border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200"><AlertTriangle size={16} /> Unable to resolve the selected owner profile. Choose another user or retry.</div> : null}
      {selected ? <OwnerProfileCard profile={selected} compact={compact} /> : <div className="mt-3 rounded-lg border border-dashed border-cyan-300/20 p-3 text-sm text-slate-500">No owner selected. Search IAM users or choose a suggested owner.</div>}
    </section>
  );
}

function OwnerOption({ candidate, selected, disabled, onSelect }: { candidate: LopaOwnerProfile; selected: boolean; disabled: boolean; onSelect: (id: string) => void }) {
  return <button type="button" disabled={disabled} onClick={() => onSelect(candidate.id)} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${selected ? 'bg-cyan-500/15 ring-1 ring-cyan-400/40' : 'hover:bg-slate-100 dark:hover:bg-white/5'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}><div className="min-w-0"><div className="truncate font-semibold">{candidate.displayName}</div><div className="truncate text-xs text-slate-500">{candidate.email} {candidate.jobTitle ? `- ${candidate.jobTitle}` : ''}</div></div>{candidate.accessWarning ? <span className="max-w-40 text-right text-xs text-amber-600 dark:text-amber-300">{candidate.accessWarning}</span> : selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : null}</button>;
}

function OwnerProfileCard({ profile, compact }: { profile: LopaOwnerProfile; compact: boolean }) {
  const access = profile.siteAccess ?? [];
  const warning = profile.accessWarning ?? profile.validation?.errors?.[0];
  return <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-500/5 p-3"><div className="flex gap-3"><Avatar profile={profile} /><div className="min-w-0 flex-1"><div className="font-bold">{profile.displayName}</div><div className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</div><div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{[profile.jobTitle, profile.department, profile.organization ?? profile.companyName].filter(Boolean).join(' - ') || 'No job profile details available'}</div></div><span className={`h-fit rounded px-2 py-1 text-xs font-semibold ${profile.active === false ? 'bg-red-500/15 text-red-700 dark:text-red-200' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'}`}>{profile.active === false ? 'Inactive' : 'Active'}</span></div>{!compact ? <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><Meta label="Roles" value={profile.roles?.join(', ') || 'No role assigned'} /><Meta label="Discipline" value={profile.discipline || 'Not specified'} /><Meta label="Site access" value={access.map((item) => item.name).join(', ') || 'No explicit site access'} /><Meta label="Unit / area access" value={[...(profile.unitAccess ?? []).map((item) => item.name), ...(profile.areaAccess ?? []).map((item) => item.name)].join(', ') || 'All assigned site areas'} /></div> : null}{profile.suggestionReasons?.length ? <div className="mt-3 flex flex-wrap gap-1">{profile.suggestionReasons.map((reason) => <span key={reason} className="rounded border border-blue-400/25 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-700 dark:text-blue-100">{reason}</span>)}</div> : null}{warning ? <div className="mt-3 flex gap-2 rounded bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-100"><AlertTriangle size={14} className="shrink-0" />{warning}</div> : null}</div>;
}

function Avatar({ profile }: { profile: LopaOwnerProfile }) {
  const initials = profile.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-cyan-300/30 object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-700 dark:text-cyan-100">{initials || 'U'}</div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><div className="text-slate-500">{label}</div><div className="mt-0.5 text-slate-700 dark:text-slate-200">{value}</div></div>;
}
