export function RelationshipTypeBadge({ type }: { type?: string | null }) {
  return <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{type || 'Related'}</span>;
}
