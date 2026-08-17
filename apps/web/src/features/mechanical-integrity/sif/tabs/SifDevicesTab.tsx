import { SectionCard, SafeguardRegisterTable } from '../../safeguards/SafeguardUiPrimitives';
export function SifDevicesTab({ devices }: { sifId: string; devices?: any[] }) {
  return <SectionCard title="Sensors / Logic Solver / Final Elements" description="SIF device list by role, equipment link, bypass state, test status, and proof-test coverage."><SafeguardRegisterTable rows={devices} kind="SIF device" /></SectionCard>;
}
