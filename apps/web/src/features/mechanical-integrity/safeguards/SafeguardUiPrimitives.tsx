'use client';

import type { ReactNode } from 'react';
import { SafeguardDueStatusBadge } from '../shared/SafeguardDueStatusBadge';
import { SafeguardTestResultBadge } from '../shared/SafeguardTestResultBadge';
import { SifStatusBadge } from '../shared/SifStatusBadge';
import { SilBadge } from '../shared/SilBadge';
import type { MiSafeguardRow } from '../types/safeguard-common.types';

export function cardValue(value: unknown, fallback = 'Not recorded') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function SectionCard({ title, description, actions, children }: { title: string; description?: string | undefined; actions?: ReactNode | undefined; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--psm-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ActionButton({ children, onClick, disabled, title, type = 'button' }: { children: ReactNode; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; type?: 'button' | 'submit' | undefined }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={disabled ? title : undefined} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled, title, type = 'button' }: { children: ReactNode; onClick?: (() => void) | undefined; disabled?: boolean | undefined; title?: string | undefined; type?: 'button' | 'submit' | undefined }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={disabled ? title : undefined} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
      {children}
    </button>
  );
}

export function SummaryGrid({ cards }: { cards: Array<[string, unknown, string?]> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {cards.map(([label, value, hint]) => (
        <div key={label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <p className="text-xs text-[var(--psm-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold">{cardValue(value, '0')}</p>
          {hint ? <p className="mt-1 text-xs text-[var(--psm-muted)]">{hint}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function KeyValueGrid({ items }: { items: Array<[string, unknown]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <dt className="text-xs text-[var(--psm-muted)]">{label}</dt>
          <dd className="mt-1 text-sm font-semibold">{cardValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SafeguardRegisterTable({ rows, kind, onOpen }: { rows?: MiSafeguardRow[] | undefined; kind: string; onOpen?: ((row: MiSafeguardRow) => void) | undefined }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No {kind.toLowerCase()} records found for the current filters.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-[1150px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Tag / ID', 'Name', 'Type', 'Equipment', 'SIL / Priority', 'Status', 'Due status', 'Last test', 'Next due', 'Last result', 'Bypass', 'LOPA/SIL', 'Startup', 'Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{cardValue(row.sifTag ?? row.sif_tag ?? row.interlockTag ?? row.interlock_tag ?? row.alarmTag ?? row.alarm_tag ?? row.testNumber ?? row.test_number ?? row.tag)}</td>
              <td className="px-4 py-3">{cardValue(row.sifName ?? row.sif_name ?? row.interlockName ?? row.interlock_name ?? row.alarmName ?? row.alarm_name ?? row.name)}</td>
              <td className="px-4 py-3">{cardValue(row.sifType ?? row.sif_type ?? row.interlockType ?? row.interlock_type ?? row.alarmType ?? row.alarm_type ?? row.safeguardType ?? row.safeguard_type)}</td>
              <td className="px-4 py-3">{cardValue(row.equipmentTag ?? row.equipment_tag ?? row.equipmentId ?? row.equipment_id)}</td>
              <td className="px-4 py-3"><SilBadge sil={row.targetSil ?? row.target_sil ?? row.alarmPriority ?? row.alarm_priority} /></td>
              <td className="px-4 py-3"><SifStatusBadge status={row.status} /></td>
              <td className="px-4 py-3"><SafeguardDueStatusBadge status={row.dueStatus ?? row.due_status} /></td>
              <td className="px-4 py-3">{cardValue(row.lastTestDate ?? row.last_test_date, 'None')}</td>
              <td className="px-4 py-3">{cardValue(row.nextTestDueDate ?? row.next_test_due_date, 'Not scheduled')}</td>
              <td className="px-4 py-3"><SafeguardTestResultBadge result={row.lastTestResult ?? row.last_test_result ?? row.finalResult ?? row.final_result} /></td>
              <td className="px-4 py-3">{cardValue(row.bypassActive ?? row.bypass_active, 'No')}</td>
              <td className="px-4 py-3">{cardValue(row.lopaSilLinked ?? row.lopa_sil_linked, 'No')}</td>
              <td className="px-4 py-3">{cardValue(row.startupBlocked ?? row.startup_blocked, 'No')}</td>
              <td className="px-4 py-3"><ActionButton onClick={() => onOpen?.(row)}>Open</ActionButton></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SafeguardMobileCards({ rows, onOpen }: { rows?: MiSafeguardRow[] | undefined; onOpen?: ((row: MiSafeguardRow) => void) | undefined }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <button key={row.id} type="button" onClick={() => onOpen?.(row)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{cardValue(row.sifTag ?? row.sif_tag ?? row.interlockTag ?? row.interlock_tag ?? row.alarmTag ?? row.alarm_tag ?? row.testNumber ?? row.test_number)}</p>
              <p className="text-sm text-[var(--psm-muted)]">{cardValue(row.sifName ?? row.sif_name ?? row.interlockName ?? row.interlock_name ?? row.alarmName ?? row.alarm_name ?? row.description)}</p>
            </div>
            <SifStatusBadge status={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <SafeguardDueStatusBadge status={row.dueStatus ?? row.due_status} />
            <SafeguardTestResultBadge result={row.lastTestResult ?? row.last_test_result ?? row.finalResult ?? row.final_result} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function MissingDataList({ items }: { items?: string[] | undefined }) {
  if (!items?.length) return <p className="text-sm text-success">No missing required data reported by the backend.</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => <li key={item} className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{item}</li>)}
    </ul>
  );
}
