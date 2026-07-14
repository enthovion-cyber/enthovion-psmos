import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaInitiatingEventSnapshotPanel({ event }: { event: Record<string, any> }) {
  return (
    <LopaPanel title="Initiating Event Snapshot">
      <div className="mb-3 flex gap-2">
        <TonePill tone={event.completionStatus === 'Complete' ? 'success' : 'warning'}>{event.completionStatus ?? 'Incomplete'}</TonePill>
        <TonePill tone={event.frequency ? 'info' : 'warning'}>{event.frequency ? `${event.frequency} ${event.unit ?? ''}` : 'Frequency missing'}</TonePill>
        {event.libraryStatus ? <TonePill tone={event.libraryStatus === 'Approved' ? 'success' : 'warning'}>{event.libraryStatus}</TonePill> : null}
      </div>
      <FieldGrid items={[
        ['Description', event.description],
        ['Category / failure mode', [event.category, event.failureMode].filter(Boolean).join(' / ')],
        ['Frequency input method', event.frequencyInputMethod],
        ['Library reference', event.libraryReference],
        ['Library revision/status', [event.libraryRevision ? `Rev ${event.libraryRevision}` : null, event.libraryStatus].filter(Boolean).join(' / ')],
        ['Frequency source', event.sourceReference],
        ['Basis', event.basis],
        ['Low / high estimate', [event.lowEstimate, event.highEstimate].filter(Boolean).join(' / ')],
        ['Confidence level', event.confidenceLevel],
        ['Site modifier', event.siteModifier],
        ['Engineering justification', event.engineeringJustification],
        ['Enabling condition', event.enablingConditionStatus],
        ['Notes', event.notes]
      ]} />
    </LopaPanel>
  );
}
