"use client";
import { useSearchParams } from "next/navigation";
import { AuditCapaFormPage } from "./AuditCapaFormPage";

export function AuditCapaCreateFromFindingPage({ findingId }: { findingId?: string | undefined }) {
  const search = useSearchParams();
  return <AuditCapaFormPage findingId={findingId ?? search.get("findingId") ?? undefined} />;
}
