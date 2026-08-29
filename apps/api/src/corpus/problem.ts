import type { Difficulty, PatternFamily, Tier } from '@prisma/client';
import type { Lang } from './types.js';

/**
 * One authored or imported problem, before it becomes a row.
 *
 * Note what is *not* here: `driverCode` and `starterCode`. Those are generated
 * from `signatureId`, which is the whole point of the signature registry — a
 * problem definition that could carry its own harness would, eventually, carry
 * a subtly different one, and then there would be 695 of them.
 */
export interface ProblemDefinition {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tier: Tier;
  patternFamily: PatternFamily;
  patternTags: string[];
  /** Must exist in the signature registry, or the import fails loudly. */
  signatureId: string;
  promptMarkdown: string;
  /**
   * Shown only after the session resolves. Written for someone who did *not*
   * get it: name the pattern, say why it works, then show the code.
   */
  editorialMarkdown: string;
  editorialUrl?: string;
  /** Per-language worked solution. Every language present is judged on import. */
  referenceSolution: Partial<Record<Lang, string>>;
  tests: Array<{ stdin: string; expectedStdout: string; isSample?: boolean }>;
  provenance: Provenance;
  /**
   * True when the whole answer is one published value — the Project Euler
   * shape. Feeds `answerLookupRisk`, which is what actually removes such a
   * problem from the unlock pool.
   */
  hasPublishedSingleAnswer?: boolean;
  /** Seed for the speed gate and for `lockWindowFit`. */
  avgSolveSeconds?: number;
}

/**
 * Where a problem came from, per row.
 *
 * All five are required. Not defensive — necessary: `data/NOTICE` is generated
 * from these columns, and a single row with a missing `sourceRef` produces a
 * notice that under-attributes a licence we are relying on. See rule 4 in
 * docs/CORPUS-SOURCES.md.
 */
export interface Provenance {
  /** Short key, e.g. "codelock-authored", "mbpp". */
  source: string;
  sourceUrl: string;
  /** SPDX identifier where one exists. */
  sourceLicense: string;
  /** The exact wording the licence requires, verbatim. Empty only for CC0. */
  attributionText: string;
  /** Which upstream strand, e.g. "code_contests:codeforces". */
  sourceRef: string;
}

/**
 * Problems we wrote ourselves.
 *
 * CC0 rather than permissive-with-attribution: this corpus exists so people
 * learning to code have something to practise on, and a licence that makes
 * reuse a paperwork exercise works against that. It also keeps the authored
 * material unambiguously outside the `data/` tier.
 */
export const AUTHORED: Provenance = {
  source: 'codelock-authored',
  sourceUrl: 'https://github.com/TommyDeLeon/codelock',
  sourceLicense: 'CC0-1.0',
  attributionText: '',
  sourceRef: 'codelock-authored',
};
