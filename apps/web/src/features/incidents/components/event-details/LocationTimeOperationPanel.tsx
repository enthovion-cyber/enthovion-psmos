import { Field, ReadOnlyFact, TabPanel } from '../shared/IncidentTabPrimitives';

export function LocationTimeOperationPanel({ form, set, data }: any) {
  return (
    <TabPanel title="Location / Time / Operation">
      <div className="grid gap-3 md:grid-cols-2">
        <ReadOnlyFact label="Site" value={data.locationTimeOperation?.site?.name ?? data.locationTimeOperation?.site?.code} />
        <ReadOnlyFact label="Unit" value={data.locationTimeOperation?.unit?.name} />
        <ReadOnlyFact label="Area" value={data.locationTimeOperation?.area?.name} />
        <Field label="Exact location" value={form.exactLocation} onChange={(v) => set('exactLocation', v)} />
        <Field label="Event date/time" type="datetime-local" value={form.eventDateTime} onChange={(v) => set('eventDateTime', v)} />
        <Field label="Reported date/time" type="datetime-local" value={form.reportedDateTime} onChange={(v) => set('reportedDateTime', v)} />
        <Field label="Operating mode" value={form.operatingMode} onChange={(v) => set('operatingMode', v)} />
        <Field label="Shift / workgroup" value={`${form.shift ?? ''}${form.workgroup ? ` / ${form.workgroup}` : ''}`} onChange={(v) => set('shift', v)} />
        <Field label="Weather / condition" value={form.weatherCondition} onChange={(v) => set('weatherCondition', v)} wide />
      </div>
    </TabPanel>
  );
}
