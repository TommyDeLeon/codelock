import { prisma } from '../lib/prisma.js';
import { rank } from '../services/valueRanker.js';
import type { ProblemDefinition } from './problem.js';
import { driversFor, getSignature, stubsFor } from './signatures.js';
import type { Lang } from './types.js';

/**
 * Corpus ingestion.
 *
 * Two properties the brief insists on, which are really the same property —
 * that running this twice is safe:
 *
 * 1. **Idempotent.** Keyed on `slug`, and test cases are upserted by ordinal
 *    rather than deleted and recreated, so a second run leaves the same rows
 *    with the same ids. Re-import is then routine instead of something people
 *    are afraid of.
 *
 * 2. **Incomplete means INACTIVE.** A problem with no driver, no test cases or
 *    no measured reference runtime is imported and then never served. Not
 *    skipped — imported, visibly, so it shows up as outstanding work rather
 *    than vanishing. And never served, because each of those gaps produces the
 *    same user-facing failure: a lock nobody can solve their way out of.
 */

export interface ImportOptions {
  /** Measured reference runtimes, per slug per language, in ms. */
  runtimesBySlug?: Record<string, Partial<Record<Lang, number>>>;
  /** Report what would change without writing. */
  dryRun?: boolean;
}

export interface ImportResult {
  slug: string;
  action: 'created' | 'updated';
  isActive: boolean;
  /** Why it is inactive, if it is. */
  blockedBy: string[];
  valueScore: number;
  rank: string;
}

/**
 * Reasons a problem may not be served.
 *
 * A list rather than a boolean so the importer can print what is actually
 * missing. "Imported 40, activated 12" with no explanation is a report nobody
 * can act on.
 */
export function blockingGaps(
  def: ProblemDefinition,
  runtimes: Partial<Record<Lang, number>> | undefined,
): string[] {
  const gaps: string[] = [];
  if (def.tests.length === 0) gaps.push('no test cases');
  if (!def.signatureId) gaps.push('no signatureId, so no driver can be generated');
  if (!runtimes || Object.keys(runtimes).length === 0) {
    gaps.push('no measured referenceRuntimeMs (run the importer with --measure)');
  }
  if (Object.keys(def.referenceSolution).length === 0) {
    gaps.push('no reference solution, so the debrief would leave a failed user with nothing');
  }
  return gaps;
}

/** Fail loudly on anything structurally wrong, before touching the database. */
export function validateDefinition(def: ProblemDefinition): void {
  // Throws with the list of known ids if the signature does not exist.
  getSignature(def.signatureId);

  const { provenance } = def;
  for (const field of ['source', 'sourceUrl', 'sourceLicense', 'sourceRef'] as const) {
    if (!provenance[field]?.trim()) {
      throw new Error(
        `${def.slug}: provenance.${field} is required (docs/CORPUS-SOURCES.md, rule 4)`,
      );
    }
  }
  // CC0 is the one licence here that genuinely requires no attribution text.
  // Every other licence does, and an empty string would under-attribute silently.
  if (provenance.sourceLicense !== 'CC0-1.0' && !provenance.attributionText.trim()) {
    throw new Error(
      `${def.slug}: ${provenance.sourceLicense} requires attributionText; only CC0-1.0 may leave it empty`,
    );
  }
}

/** Import (or re-import) a set of definitions. */
export async function importProblems(
  definitions: ProblemDefinition[],
  options: ImportOptions = {},
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  for (const def of definitions) {
    validateDefinition(def);

    // One transaction per definition, spanning the read as well as the writes.
    //
    // The read belongs inside it because `referenceRuntimeMs` is *merged* with
    // the existing row when this run did not measure. Reading outside the
    // transaction lets a concurrent `--measure` run commit between the read and
    // the write, and this loop then overwrites the fresh measurement with the
    // stale value it read moments earlier. Losing calibration does not fail
    // loudly; it turns the speed gate back into the coin flip it used to be.
    //
    // The writes belong inside it because `isActive` is computed from the
    // definition's test count rather than from what actually reached the table.
    // A crash between the problem upsert and the last test-case upsert would
    // otherwise leave a row marked active and servable with an incomplete
    // hidden test suite — the same "report says one thing, the database says
    // another" shape as the outage that deactivated the whole corpus.
    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.problem.findUnique({
          where: { slug: def.slug },
          select: { id: true, referenceRuntimeMs: true },
        });

        // Keep a previously measured runtime when this run did not measure.
        const measured = options.runtimesBySlug?.[def.slug];
        const referenceRuntimeMs =
          measured && Object.keys(measured).length > 0
            ? measured
            : ((existing?.referenceRuntimeMs as Record<string, number> | undefined) ?? {});

        // Gaps are computed from the *effective* runtimes, not from what this
        // particular run measured. Checking the run's own input instead meant a
        // re-import without --measure deactivated every problem that was
        // already measured and live — a silent, total corpus outage on a
        // routine command.
        const gaps = blockingGaps(def, referenceRuntimeMs);
        const isActive = gaps.length === 0;

        const ranking = rank({
          tier: def.tier,
          source: def.provenance.source,
          avgSolveSeconds: def.avgSolveSeconds ?? 600,
          editorialMarkdown: def.editorialMarkdown,
          editorialUrl: def.editorialUrl ?? null,
          testCaseCount: def.tests.length,
          hasPublishedSingleAnswer: def.hasPublishedSingleAnswer,
        });

        const data = {
          title: def.title,
          difficulty: def.difficulty,
          promptMarkdown: def.promptMarkdown,
          tags: def.patternTags,
          starterCode: stubsFor(def.signatureId),
          driverCode: driversFor(def.signatureId),
          referenceRuntimeMs,
          avgSolveSeconds: def.avgSolveSeconds ?? 600,

          source: def.provenance.source,
          sourceUrl: def.provenance.sourceUrl,
          sourceLicense: def.provenance.sourceLicense,
          attributionText: def.provenance.attributionText,
          sourceRef: def.provenance.sourceRef,

          patternFamily: def.patternFamily,
          patternTags: def.patternTags,
          tier: def.tier,
          signatureId: def.signatureId,

          editorialMarkdown: def.editorialMarkdown,
          editorialUrl: def.editorialUrl ?? null,
          referenceSolution: def.referenceSolution,

          patternTransfer: ranking.patternTransfer,
          interviewFrequency: ranking.interviewFrequency,
          lockWindowFit: ranking.lockWindowFit,
          explanationQuality: ranking.explanationQuality,
          judgeability: ranking.judgeability,
          answerLookupRisk: ranking.answerLookupRisk,
          valueScore: ranking.valueScore,
          eligibleForUnlock: ranking.eligibleForUnlock,

          isActive,
        };

        const outcome: ImportResult = {
          slug: def.slug,
          action: existing ? 'updated' : 'created',
          isActive,
          blockedBy: gaps,
          valueScore: ranking.valueScore,
          rank: ranking.rank,
        };

        if (options.dryRun) return outcome;

        const problem = await tx.problem.upsert({
          where: { slug: def.slug },
          create: { slug: def.slug, ...data },
          update: data,
          select: { id: true },
        });

        // Upsert by ordinal rather than wipe-and-recreate: stable ids make a
        // second run a genuine no-op instead of churn that merely looks like a
        // change.
        for (const [ordinal, test] of def.tests.entries()) {
          await tx.testCase.upsert({
            where: { problemId_ordinal: { problemId: problem.id, ordinal } },
            create: {
              problemId: problem.id,
              ordinal,
              stdin: test.stdin,
              expectedStdout: test.expectedStdout,
              isSample: test.isSample ?? false,
            },
            update: {
              stdin: test.stdin,
              expectedStdout: test.expectedStdout,
              isSample: test.isSample ?? false,
            },
          });
        }

        // A definition that lost test cases must not leave the old ones behind.
        await tx.testCase.deleteMany({
          where: { problemId: problem.id, ordinal: { gte: def.tests.length } },
        });

        return outcome;
      },
      // A problem carries up to a few dozen test cases, so the default 5s
      // interactive-transaction budget is ample locally but not against a
      // network-hop database. Raised rather than tuned per environment.
      { timeout: 30_000 },
    );

    results.push(result);
  }

  return results;
}

/**
 * Build `data/NOTICE` from what was actually imported.
 *
 * Generated, never hand-maintained. A hand-written notice drifts the moment
 * someone adds a source, and a licence notice that does not match the shipped
 * data is worse than none — it is a documented claim that happens to be false.
 */
export function generateNotice(
  rows: Array<{ source: string; sourceUrl: string; sourceLicense: string; attributionText: string }>,
): string {
  const bySource = new Map<
    string,
    { url: string; license: string; attribution: string; count: number }
  >();

  for (const row of rows) {
    const existing = bySource.get(row.source);
    if (existing) {
      existing.count += 1;
      continue;
    }
    bySource.set(row.source, {
      url: row.sourceUrl,
      license: row.sourceLicense,
      attribution: row.attributionText,
      count: 1,
    });
  }

  const lines = [
    'CodeLock problem corpus — attribution notice',
    '',
    'Generated from the provenance columns of the imported rows. Do not edit by',
    'hand: re-run `npm run import:corpus -w @codelock/api` instead.',
    '',
    `Sources: ${bySource.size}. Problems: ${rows.length}.`,
    '',
  ];

  for (const [source, info] of [...bySource.entries()].sort()) {
    lines.push(`## ${source} (${info.count} problem${info.count === 1 ? '' : 's'})`);
    lines.push('');
    lines.push(`Licence: ${info.license}`);
    lines.push(`Source:  ${info.url}`);
    if (info.attribution.trim()) {
      lines.push('');
      lines.push(info.attribution.trim());
    }
    lines.push('');
  }

  return lines.join('\n');
}
