import { FieldGrid, LopaPanel } from '../overview/LopaOverviewShared';
import { FrequencyDisplay } from '../shared/FrequencyDisplay';

export function InitiatingEventFrequencyPanel({ event }: { event: any }) {
  return (
    <LopaPanel title="Initiating Event Frequency">
      <FieldGrid items={[
        ['Description', event?.description ?? 'Missing'],
        ['Category', event?.event_category ?? '-'],
        ['Failure mode', event?.failure_mode ?? '-'],
        ['Frequency', <FrequencyDisplay key="freq" value={event?.frequency_per_year} unit={event?.frequency_unit ?? '/yr'} />],
        ['Source / basis', event?.frequency_source ?? event?.basis ?? '-'],
        ['Confidence', event?.confidence_level ?? '-']
      ]} />
    </LopaPanel>
  );
}
