import { PssrRequiredWorkersSection } from '../sections/PssrRequiredWorkersSection';

export function PssrRequiredWorkersTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <PssrRequiredWorkersSection rows={rows} />;
}

