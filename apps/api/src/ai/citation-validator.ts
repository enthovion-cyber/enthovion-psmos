import { CitationValidation } from './ai.types';

const CITATION = /\[(S\d+)\]/g;

/** Verifies citations refer to supplied sources and flags substantive uncited sentences. */
export function validateCitations(answer: string, validSourceIds: string[]): CitationValidation {
  const valid = new Set(validSourceIds);
  const cited = new Set<string>();
  const unknown = new Set<string>();
  for (const m of answer.matchAll(CITATION)) {
    const id = m[1] as string;
    cited.add(id);
    if (!valid.has(id)) unknown.add(id);
  }
  const uncited = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && !/\[S\d+\]/.test(s) && !/(insufficient|cannot determine|not enough)/i.test(s));
  return {
    valid: unknown.size === 0 && uncited.length === 0 && cited.size > 0,
    citedIds: [...cited],
    unknownCitations: [...unknown],
    uncitedSentences: uncited
  };
}
