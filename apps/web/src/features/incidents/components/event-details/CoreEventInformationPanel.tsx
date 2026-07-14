import { Field, SelectField, TabPanel } from '../shared/IncidentTabPrimitives';

export function CoreEventInformationPanel({ form, set, data }: any) {
  return (
    <TabPanel title="Core Event Information">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Incident title" value={form.title} onChange={(v) => set('title', v)} />
        <SelectField label="Event type" value={form.eventType} options={data.eventTypeClassification?.eventTypes ?? []} onChange={(v) => set('eventType', v)} />
        <Field label="Short description" value={form.shortDescription} onChange={(v) => set('shortDescription', v)} wide />
        <SelectField label="Classification" value={form.classification} options={data.eventTypeClassification?.classifications ?? []} onChange={(v) => set('classification', v)} />
      </div>
    </TabPanel>
  );
}
