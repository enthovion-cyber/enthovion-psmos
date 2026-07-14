export function PermissionActionBadge({ action }: { action: string }) {
  return <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-info">{action}</span>;
}

