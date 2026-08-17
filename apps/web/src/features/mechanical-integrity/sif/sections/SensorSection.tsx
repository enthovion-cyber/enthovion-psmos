import { FormSection, TextArea, TextField } from './section-fields';
export function SensorSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Sensors" description="Initiators, transmitters, switches, diagnostics, and maintenance basis.">
    <TextField label="Sensor tag(s)" value={value.sensorTags ?? value.sensor_tags} onChange={(sensorTags) => onChange({ sensorTags })} />
    <TextArea label="Sensor notes" value={value.sensorNotes ?? value.sensor_notes} onChange={(sensorNotes) => onChange({ sensorNotes })} />
  </FormSection>;
}
