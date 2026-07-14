import { Field, TabPanel, ToggleGrid } from '../shared/IncidentTabPrimitives';

export function PtwMocPssrContextPanel({ form, set }: any) {
  return (
    <TabPanel title="PTW / MOC / PSSR Context">
      <ToggleGrid form={form} set={set} keys={[
        ['ptwInvolved', 'PTW involved'],
        ['ptwReviewRequired', 'PTW review required'],
        ['mocInvolved', 'MOC involved'],
        ['mocRequired', 'MOC required'],
        ['pssrInvolved', 'PSSR involved'],
        ['pssrRequired', 'PSSR required']
      ]} />
      <div className="mt-3 grid gap-3">
        <Field label="PTW reference" value={form.ptwId} onChange={(v) => set('ptwId', v)} />
        <Field label="MOC reference" value={form.mocId} onChange={(v) => set('mocId', v)} />
        <Field label="PSSR reference" value={form.pssrId} onChange={(v) => set('pssrId', v)} />
      </div>
    </TabPanel>
  );
}
