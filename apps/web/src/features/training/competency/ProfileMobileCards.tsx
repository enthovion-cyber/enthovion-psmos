import { ProfileTable } from './ProfileTable';
export function ProfileMobileCards({ rows }: { rows: Record<string, any>[] }) { return <div className="md:hidden"><ProfileTable rows={rows} compact /></div>; }
