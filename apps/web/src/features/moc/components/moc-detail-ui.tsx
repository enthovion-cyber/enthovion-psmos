"use client";

import type { ReactNode } from "react";

export const detailInput =
  "h-10 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm text-[var(--psm-fg)] outline-none placeholder:text-[var(--psm-muted)] focus:border-primary transition-colors";
export const detailTextarea =
  "min-h-24 w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-fg)] outline-none placeholder:text-[var(--psm-muted)] focus:border-primary transition-colors";

export function DetailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm text-[var(--psm-fg)] transition-colors">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-[var(--psm-fg)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  tone = "slate",
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate" | "purple";
  sub?: ReactNode;
}) {
  const tones = {
    green: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-300/20",
    amber: "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-300/20",
    red: "text-rose-700 bg-rose-50 border-rose-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-300/20",
    blue: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-300/20",
    purple: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-300/20",
    slate: "text-[var(--psm-fg)] bg-[var(--psm-surface-2)] border-[var(--psm-line)]",
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-80 font-semibold">{label}</p>
      <div className="mt-1 text-2xl font-black">{value}</div>
      {sub ? <div className="mt-1 text-xs opacity-75">{sub}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate" | "purple";
}) {
  const tones = {
    green: "border-emerald-300/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    amber: "border-amber-300/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
    red: "border-rose-300/40 bg-rose-500/15 text-rose-800 dark:text-rose-200",
    blue: "border-blue-300/40 bg-blue-500/15 text-blue-800 dark:text-blue-200",
    purple: "border-violet-300/40 bg-violet-500/15 text-violet-800 dark:text-violet-200",
    slate: "border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-6 text-center">
      <p className="font-bold text-[var(--psm-fg)]">{title}</p>
      {detail ? <p className="mt-1 text-sm text-[var(--psm-muted)]">{detail}</p> : null}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-lg bg-[var(--psm-surface-2)] border border-[var(--psm-line)]"
        />
      ))}
    </div>
  );
}

export function ErrorState({
  message = "Unable to load this MOC section.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-red-300/40 bg-red-500/10 p-4 text-sm font-bold text-red-700 dark:text-red-200">
      {message}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ProgressBar({
  value,
  tone = "blue",
}: {
  value: number;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
  };
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--psm-surface-3)]">
      <div
        className={`h-full ${tones[tone]} transition-all`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function InfoBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 transition-colors">
      <p className="text-xs uppercase tracking-wide text-[var(--psm-muted)] font-semibold">{label}</p>
      <div className="mt-1 font-bold text-[var(--psm-fg)]">{value}</div>
      {sub ? <div className="mt-1 text-xs text-[var(--psm-muted)]">{sub}</div> : null}
    </div>
  );
}

export function MocButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
  className = "",
  icon,
}: {
  children?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | undefined;
  type?: "button" | "submit" | undefined;
  className?: string | undefined;
  icon?: ReactNode | undefined;
}) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-sm disabled:opacity-50",
    secondary: "border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] disabled:opacity-50",
    outline: "border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] disabled:opacity-50",
    danger: "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50",
    ghost: "text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-fg)] disabled:opacity-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-primary ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function riskTone(risk?: string): "green" | "amber" | "red" | "purple" {
  if (risk === "Critical") return "purple";
  if (risk === "High") return "red";
  if (risk === "Medium") return "amber";
  return "green";
}

export function statusTone(
  status?: string,
): "green" | "amber" | "red" | "blue" | "slate" {
  if (["Closed", "Ready For Startup", "Approved"].includes(status ?? ""))
    return "green";
  if (
    ["Rejected", "Cancelled", "Overdue Temporary Change"].includes(status ?? "")
  )
    return "red";
  if (["Implementation", "Pending PSSR", "Under Review"].includes(status ?? ""))
    return "amber";
  if (status === "Submitted") return "blue";
  return "slate";
}
