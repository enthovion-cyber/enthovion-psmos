import { CapaActionListEditor } from "./CapaActionListEditor";
import type { AuditCapaContext } from "../../types/audit-capa.types";

export function CapaCorrectiveActionsSection({ form, setForm, context }: { form: Record<string, any>; setForm: (patch: Record<string, any>) => void; context?: AuditCapaContext | undefined }) {
  return <CapaActionListEditor title="Corrective actions" description="Corrective actions address the immediate non-conformance and are created as Audit CAPA action mappings." actionType="Corrective Action" rows={form.correctiveActions ?? []} context={context} onChange={(rows) => setForm({ correctiveActions: rows })} />;
}
