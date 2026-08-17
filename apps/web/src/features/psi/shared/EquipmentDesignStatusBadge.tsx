import { PsiStatusBadge } from './PsiStatusBadge';

export function EquipmentDesignStatusBadge({ value }: { value?: string | null }) {
  return <PsiStatusBadge status={value ?? 'Draft'} />;
}
