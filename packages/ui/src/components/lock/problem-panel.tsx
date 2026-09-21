'use client';

import Markdown from 'react-markdown';
import type { PublicProblem } from '@codelock/shared';
import { DifficultyBadge } from '../ui/primitives';
import { formatCompact } from '../../lib/utils';

/**
 * Why this problem was chosen, in the learner's words.
 *
 * Shown rather than kept in a log, because the complaint this whole layer
 * answers was problems arriving with no account of why. `skillEligible: false`
 * is the case that matters most: the selector found nothing the learner was
 * ready for and served this anyway so the lock could still open. Saying that
 * plainly is the difference between a hard problem and a mystery.
 *
 * No warning colour, no apology. It is information, not a telling-off.
 */
function FitNote({ eligible, note }: { eligible: boolean | null; note: string | null }) {
  if (!note) return null;

  if (eligible === false) {
    return (
      <p className="mt-3 rounded-sm border border-border bg-surface-2 p-3 text-[13px] text-muted">
        This one goes further than what you have practised, because nothing
        closer was ready and the lock still needs a way to open. It {note}.
        Hints are here from the start and cost nothing.
      </p>
    );
  }

  return <p className="mt-1 text-[13px] text-muted">Chosen for you because it {note}.</p>;
}

export function ProblemPanel({
  problem,
  skillEligible = null,
  skillNote = null,
}: {
  problem: PublicProblem;
  skillEligible?: boolean | null;
  skillNote?: string | null;
}) {
  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* The statement is the only thing on this screen that matters, so it is
          allowed to be a heading rather than a label. Display serif, because
          this is read rather than scanned. */}
      <h1 className="mt-3 font-display text-2xl leading-tight tracking-tight">{problem.title}</h1>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
        ~{formatCompact(problem.avgSolveSeconds)} typical
      </p>
      <FitNote eligible={skillEligible} note={skillNote} />

      <div className="prose-problem mt-5 text-sm">
        {/* Markdown only — no rehype-raw. The statement is trusted content, but
            rendering raw HTML here would make the problem bank an XSS vector. */}
        <Markdown>{problem.promptMarkdown}</Markdown>
      </div>

      {problem.sampleCases.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            Sample cases
          </h2>
          {/*
            Hairlines, not boxes.

            Each case used to be a filled grey card with a border and twelve
            pixels of padding, and three of them stacked turned the lower half
            of the statement into furniture. The data is already monospaced and
            already aligned; a rule and a label are enough to separate them,
            and the panel reads as a page instead of a form.
          */}
          <ul role="list" className="mt-3 divide-y divide-border border-y border-border">
            {problem.sampleCases.map((sample) => (
              <li key={sample.ordinal} className="grid grid-cols-[4.5rem_1fr] gap-x-4 py-3 font-mono text-[12px]">
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-faint">input</span>
                <pre className="whitespace-pre-wrap break-all">{sample.stdin}</pre>
                <span className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-faint">
                  expected
                </span>
                <pre className="mt-1.5 whitespace-pre-wrap break-all">{sample.expectedStdout}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
