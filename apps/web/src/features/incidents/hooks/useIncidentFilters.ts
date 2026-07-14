import { useState } from 'react';
import type { IncidentFilters } from '../types/incident.types';
export function useIncidentFilters() { const [filters, setFilters] = useState<IncidentFilters>({ page: 1, limit: 25, sort: 'updated_at.desc' }); return { filters, setFilters }; }
