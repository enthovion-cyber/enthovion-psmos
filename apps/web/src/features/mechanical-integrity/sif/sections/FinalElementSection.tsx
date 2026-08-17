import { FormSection, TextArea, TextField } from './section-fields';
export function FinalElementSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Final Elements" description="Valves, solenoids, relays, shutdown devices, and failure action.">
    <TextField label="Final element tag(s)" value={value.finalElementTags ?? value.final_element_tags} onChange={(finalElementTags) => onChange({ finalElementTags })} />
    <TextArea label="Final element notes" value={value.finalElementNotes ?? value.final_element_notes} onChange={(finalElementNotes) => onChange({ finalElementNotes })} />
  </FormSection>;
}
