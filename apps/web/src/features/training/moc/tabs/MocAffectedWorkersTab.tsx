import { MocAffectedWorkersSection } from '../sections/MocAffectedWorkersSection';

export function MocAffectedWorkersTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <MocAffectedWorkersSection rows={rows} />;
}
