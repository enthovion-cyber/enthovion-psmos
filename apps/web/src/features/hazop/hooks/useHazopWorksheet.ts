"use client";

import { useMemo } from "react";
import { useHazopStudy } from "./useHazop";

export function useHazopWorksheet(studyId: string, nodeId?: string | null) {
  const query = useHazopStudy(studyId);
  const data = useMemo(() => {
    const study = query.data;
    const nodes = study?.nodes ?? [];
    const scenarios = (study?.scenarios ?? []).filter((scenario: any) => !nodeId || scenario.node_id === nodeId);
    const recommendations = study?.recommendations ?? [];
    return { study, nodes, scenarios, recommendations };
  }, [nodeId, query.data]);
  return { ...query, data };
}
