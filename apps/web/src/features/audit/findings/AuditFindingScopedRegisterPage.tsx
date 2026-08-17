"use client";
import { AuditFindingRegisterPage } from "./AuditFindingRegisterPage";

export function AuditFindingScopedRegisterPage({ preset }: { preset: Record<string, unknown> }) {
  return <AuditFindingRegisterPage preset={preset} />;
}
