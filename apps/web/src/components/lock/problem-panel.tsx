'use client';

import Markdown from 'react-markdown';
import type { PublicProblem } from '@codelock/shared';
import { DifficultyBadge } from '@/components/ui/primitives';
import { formatCompact } from '@/lib/utils';

export function ProblemPanel({ problem }: { problem: PublicProblem }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      <h1 className="mt-2.5 text-lg font-semibold tracking-tight">{problem.title}</h1>
      <p className="mt-1 text-[13px] text-muted">
        Most people finish this in about {formatCompact(problem.avgSolveSeconds)}.
      </p>

      <div className="prose-problem mt-5 text-sm">
        {/* Markdown only — no rehype-raw. The statement is trusted content, but
            rendering raw HTML here would make the problem bank an XSS vector. */}
        <Markdown>{problem.promptMarkdown}</Markdown>
      </div>

      {problem.sampleCases.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[13px] font-semibold">Sample cases</h2>
          <ul role="list" className="mt-2 space-y-2">
            {problem.sampleCases.map((sample) => (
              <li
                key={sample.ordinal}
                className="rounded-sm border border-border bg-surface-2 p-3 font-mono text-[12px]"
              >
                <div className="text-faint">input</div>
                <pre className="whitespace-pre-wrap break-all">{sample.stdin}</pre>
                <div className="mt-1.5 text-faint">expected</div>
                <pre className="whitespace-pre-wrap break-all">{sample.expectedStdout}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
