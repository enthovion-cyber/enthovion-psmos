'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, TeamMemberForm } from './InvestigationTeamPrimitives';

export function AddEditTeamMemberDrawer({ open, form, set, saving, onClose, onSave, onSearchUsers }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const searchUsersRef = useRef(onSearchUsers);

  useEffect(() => {
    searchUsersRef.current = onSearchUsers;
  }, [onSearchUsers]);

  useEffect(() => {
    if (open) {
      setSearchText('');
      setSearchError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !searchUsersRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const result = await searchUsersRef.current(searchText);
        if (!cancelled) setRows(Array.isArray(result) ? result : result?.rows ?? []);
      } catch (error) {
        if (!cancelled) {
          setRows([]);
          setSearchError(error instanceof Error ? error.message : 'User search failed.');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, searchText ? 250 : 50);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, searchText]);

  const selectedUserId = form.userId ?? form.profileId;
  const sortedRows = useMemo(() => {
    const current = rows.find((row) => row.userId === selectedUserId || row.id === selectedUserId);
    const uniqueRows = rows.filter((row) => row.userId ?? row.id ?? row.email);
    return current ? [current, ...uniqueRows.filter((row) => row !== current)] : uniqueRows;
  }, [rows, selectedUserId]);

  const selectUser = (user: any) => {
    if (user === 'external') {
      set('userId', '');
      set('profileId', '');
      set('userSearch', '');
      set('displayName', '');
      set('email', '');
      set('jobTitle', '');
      set('department', '');
      set('internalExternal', 'External');
      return;
    }
    const displayName = user.displayName ?? user.display_name ?? user.name ?? user.email;
    set('userId', user.userId ?? user.id);
    set('profileId', user.profileId ?? user.profile_id ?? user.userId ?? user.id);
    set('userSearch', displayName);
    set('displayName', displayName);
    set('email', user.email);
    set('jobTitle', user.jobTitle ?? user.title);
    set('department', user.department);
    set('discipline', user.discipline ?? form.discipline);
    set('internalExternal', user.internalExternal ?? user.internal_external ?? 'Internal');
  };

  return (
    <DrawerShell open={open} title={form.id ? 'Edit Team Member' : 'Add Team Member'} onClose={onClose}>
      <section className="mb-4 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          User
          <select
            value={selectedUserId || 'external'}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'external') return selectUser('external');
              const user = sortedRows.find((row) => (row.userId ?? row.id) === value);
              if (user) selectUser(user);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-100"
          >
            <option value="external">External / manual participant</option>
            {sortedRows.map((user) => {
              const userId = user.userId ?? user.id;
              return <option key={userId ?? user.email} value={userId}>{user.displayName ?? user.display_name ?? user.email} - {user.email ?? 'no email'}</option>;
            })}
          </select>
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Search users
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search name, email, role, department"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-cyan-300/10 dark:bg-[#06111f] dark:text-slate-100"
          />
        </label>
        <div className="mt-2 text-[11px] text-slate-500">
          {searching ? 'Loading users...' : searchError ? searchError : `${sortedRows.length} IAM/RBAC user(s) loaded.`}
        </div>
      </section>
      <TeamMemberForm form={form} set={set} />
      <div className="mt-4 flex justify-end gap-2"><button className={buttonSecondary} onClick={onClose}>Cancel</button><button className={buttonPrimary} disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Member'}</button></div>
    </DrawerShell>
  );
}
