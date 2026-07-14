import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaStudyMetadataPanel({ metadata }: { metadata: Record<string, any> }) {
  return (
    <LopaPanel title="Study Scope & Metadata">
      <div className="mb-3 flex flex-wrap gap-2">
        <TonePill tone="info">{metadata.studyType ?? 'LOPA'}</TonePill>
        <TonePill tone={metadata.priority === 'High' ? 'danger' : 'warning'}>{metadata.priority ?? 'Medium'}</TonePill>
        <TonePill>{metadata.confidentialityLevel ?? 'Internal'}</TonePill>
      </div>
      <FieldGrid items={[
        ['Title', metadata.title],
        ['Description', metadata.description],
        ['Source type', metadata.source],
        ['Company / site', [metadata.companyId, metadata.siteId].filter(Boolean).join(' / ')],
        ['Unit / area', [metadata.unitId, metadata.areaId].filter(Boolean).join(' / ')],
        ['Equipment / system', metadata.equipmentTag],
        ['Owner', metadata.ownerProfile?.displayName ?? metadata.ownerName ?? metadata.ownerId],
        ['Facilitator', metadata.facilitatorId],
        ['Team summary', metadata.teamSummary],
        ['Due / revalidation', [metadata.dueDate, metadata.revalidationDueDate].filter(Boolean).join(' / ')],
        ['Created', [metadata.createdBy, metadata.createdAt ? new Date(metadata.createdAt).toLocaleDateString() : null].filter(Boolean).join(' / ')],
        ['Updated', [metadata.updatedBy, metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleDateString() : null].filter(Boolean).join(' / ')]
      ]} />
      {!!metadata.tags?.length && <div className="mt-3 flex flex-wrap gap-2">{metadata.tags.map((tag: string) => <TonePill key={tag} tone="neutral">{tag}</TonePill>)}</div>}
    </LopaPanel>
  );
}
