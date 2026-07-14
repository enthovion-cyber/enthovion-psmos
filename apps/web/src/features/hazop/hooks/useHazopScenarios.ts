"use client";

import { useMemo } from "react";
import { useHazopStudy } from "./useHazop";

export function useHazopScenarios(studyId: string, nodeId?: string | null) {
  const query = useHazopStudy(studyId);
  const scenarios = useMemo(() => {
    const rows = query.data?.scenarios ?? [];
    return nodeId ? rows.filter((scenario: any) => scenario.node_id === nodeId) : rows;
  }, [nodeId, query.data?.scenarios]);
  return { ...query, data: scenarios };
}
