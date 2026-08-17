import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './SectionField';

export function LinkedRecordsSection({ value, onChange }: { value: Record<string, any>; onChange: (value: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <SectionCard title="6. Linked Records" description="Connect PTW, LOTO, MOC, PSSR, Incident, LOPA, HAZOP, inspection, test, calibration, action, and document references without duplicating source data.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="PTW reference"><input className={inputClass} value={value.ptwReference ?? ''} onChange={(e) => set('ptwReference', e.target.value)} /></Field>
        <Field label="LOTO reference"><input className={inputClass} value={value.lotoReference ?? ''} onChange={(e) => set('lotoReference', e.target.value)} /></Field>
        <Field label="MOC reference"><input className={inputClass} value={value.mocReference ?? ''} onChange={(e) => set('mocReference', e.target.value)} /></Field>
        <Field label="PSSR reference"><input className={inputClass} value={value.pssrReference ?? ''} onChange={(e) => set('pssrReference', e.target.value)} /></Field>
        <Field label="Inspection / test reference"><input className={inputClass} value={value.testReference ?? ''} onChange={(e) => set('testReference', e.target.value)} /></Field>
        <Field label="Document / evidence reference"><input className={inputClass} value={value.documentReference ?? ''} onChange={(e) => set('documentReference', e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ['mocRequired','MOC required'], ['mocSuggested','MOC suggested'], ['ptwRequired','PTW required'], ['ptwLinked','PTW linked'], ['lotoRequired','LOTO required'], ['lotoLinked','LOTO linked'], ['pssrRequired','PSSR required'], ['startupBlocked','Startup blocked'], ['lopaWarningRequired','LOPA/SIL warning required']
        ] as Array<[string, string]>).map(([key, label]) => <BoolField key={key} label={label} checked={!!value[key]} onChange={(next) => set(key, next)} />)}
      </div>
    </SectionCard>
  );
}
