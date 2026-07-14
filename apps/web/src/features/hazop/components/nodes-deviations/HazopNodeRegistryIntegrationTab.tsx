"use client";

import { HazopDocumentMultiSelect } from "./HazopDocumentMultiSelect";
import { HazopEquipmentMultiSelect } from "./HazopEquipmentMultiSelect";
import type { HazopNodeDocumentLink, HazopNodeEquipmentLink } from "../../types/hazop-node.types";

export function HazopNodeRegistryIntegrationTab({
  equipment,
  documents,
  selectedEquipment,
  selectedDocuments,
  canOpenRegistry,
  canOpenDocuments,
  onEquipmentChange,
  onDocumentsChange,
}: {
  equipment: HazopNodeEquipmentLink[];
  documents: HazopNodeDocumentLink[];
  selectedEquipment: HazopNodeEquipmentLink[];
  selectedDocuments: HazopNodeDocumentLink[];
  canOpenRegistry?: boolean;
  canOpenDocuments?: boolean;
  onEquipmentChange: (items: HazopNodeEquipmentLink[]) => void;
  onDocumentsChange: (items: HazopNodeDocumentLink[]) => void;
}) {
  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Multiple Equipment Selection *</h3>
            <p className="text-xs text-slate-500">Filtered by active study site, unit, and area from Equipment Registry.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => onEquipmentChange([])}>Link Later</button>
        </div>
        <HazopEquipmentMultiSelect equipment={equipment} selected={selectedEquipment} onChange={onEquipmentChange} canOpenRegistry={Boolean(canOpenRegistry)} />
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Multiple P&ID / Document Selection *</h3>
            <p className="text-xs text-slate-500">Controlled P&IDs/SOPs are linked from Document Control and pinned to their current revision.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => onDocumentsChange([])}>Link Later</button>
        </div>
        <HazopDocumentMultiSelect documents={documents} selected={selectedDocuments} onChange={onDocumentsChange} canOpenDocuments={Boolean(canOpenDocuments)} />
      </section>
    </div>
  );
}
