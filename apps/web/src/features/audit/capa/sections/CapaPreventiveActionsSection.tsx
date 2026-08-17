import { CapaActionListEditor } from "./CapaActionListEditor";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaPreventiveActionsSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  return <CapaActionListEditor title="Preventive / systemic actions" description="Preventive actions address recurrence, systemic weakness, training, document, PSI, MOC, PTW, PSSR, MI, or module-specific follow-up." actionType="Preventive Action" rows={form.preventiveActions ?? []} context={context} onChange={(rows) => setForm({ preventiveActions: rows })} />;
}
