import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function EventTypeClassificationPanel({ data }: any) {
  return (
    <TabPanel title="Event Type & Classification">
      <InfoRows rows={[
        ['Selected event type', data.eventTypeClassification?.selectedEventType ?? '-'],
        ['Selected classification', data.eventTypeClassification?.selectedClassification ?? '-'],
        ['Configuration source', data.eventTypeClassification?.classificationConfig?.source ?? '-'],
        ['Configuration available', data.eventTypeClassification?.classificationConfig?.configured ? 'Yes' : 'No']
      ]} />
    </TabPanel>
  );
}
