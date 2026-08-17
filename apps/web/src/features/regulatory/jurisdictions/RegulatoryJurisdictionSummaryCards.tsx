import { RegulatoryMetricCard } from '../shared/RegulatoryUi';

export function RegulatoryJurisdictionSummaryCards({ summary }: { summary?: Record<string, any> | undefined }) {
  const cards = [
    ['Total Jurisdictions', summary?.total, '/regulatory/jurisdictions/register'],
    ['Active', summary?.active, undefined],
    ['Draft', summary?.draft, undefined],
    ['Archived', summary?.archived, undefined],
    ['Countries Covered', summary?.countriesCovered, undefined],
    ['Authorities / Regulators', summary?.authorities, '/regulatory/authorities'],
    ['Missing Authority', summary?.missingAuthority, undefined],
    ['Missing Owner', summary?.missingOwner, undefined],
    ['Recently Added', summary?.recentlyAdded, undefined],
    ['Recently Updated', summary?.recentlyUpdated, undefined]
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, href]) => <RegulatoryMetricCard key={label} label={label} value={value ?? 0} href={href} tone={label.includes('Missing') ? 'warn' : 'neutral'} />)}</div>;
}
