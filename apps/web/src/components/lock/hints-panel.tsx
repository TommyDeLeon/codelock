'use client';

import { Fragment, useId, useState } from 'react';
import { Lightbulb, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  HINT_LEVELS,
  HINT_LEVEL_LABELS,
  type HintLevel,
  type HintRequestKind,
  type HintView,
  type Language,
} from '@codelock/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Graduated help, built from what the learner's code actually does.
 *
 * Five levels, any of which can be asked for directly: a question, a trace, the
 * idea explained, an outline with one gap, the worked solution. Nobody has to
 * fail repeatedly to unlock an explanation.
 *
 * Every request sends the current code, so a hint is always about the code on
 * screen — if a mistake has been fixed, the next hint says so and moves on.
 *
 * Help is free and recorded. A later solve is saved as assisted, which is the
 * accurate record, and the panel says so up front rather than surprising
 * anyone afterwards.
 */

export interface HiddenFailure {
  ordinal: number;
  actualStdout: string | null;
  stderr: string | null;
}

export function HintsPanel({
  problemId,
  problemSlug,
  lockSessionId,
  language,
  code,
  hiddenFailure,
}: {
  problemId: string;
  problemSlug: string;
  lockSessionId?: string;
  language: Language;
  code: string;
  hiddenFailure?: HiddenFailure | null;
}) {
  const [hint, setHint] = useState<HintView | null>(null);
  const [codeAtHint, setCodeAtHint] = useState<string | null>(null);
  const [earlier, setEarlier] = useState<HintView[]>([]);
  const [pending, setPending] = useState<HintRequestKind | null>(null);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [rated, setRated] = useState<boolean | null>(null);
  const [term, setTerm] = useState('');
  const termId = useId();

  async function ask(request: HintRequestKind, extra: { level?: HintLevel; term?: string } = {}) {
    if (pending) return;
    setPending(request);
    try {
      const next = await api.tutor.hint({
        problemId,
        ...(lockSessionId ? { lockSessionId } : {}),
        language,
        sourceCode: code,
        request,
        ...extra,
        ...(hiddenFailure ? { hiddenFailure } : {}),
      });
      if (hint) setEarlier((list) => [hint, ...list].slice(0, 6));
      setHint(next);
      setCodeAtHint(code);
      setRated(null);
      setTerm('');
      setConfirmSolution(false);
    } catch (err) {
      // Help failing must never trap anyone: the problem, the editor and every
      // exit stay exactly where they were.
      toast.error(err instanceof Error ? `Could not load help: ${err.message}` : 'Could not load help.');
    } finally {
      setPending(null);
    }
  }

  function sendHelpful(helpful: boolean) {
    void api.tutor
      .feedback({ kind: 'hint', problemSlug, helpful, hintLevel: hint?.level, strategy: hint?.strategy })
      .catch(() => undefined);
  }

  const codeChanged = hint !== null && codeAtHint !== null && codeAtHint !== code;
  const busy = pending !== null;

  return (
    <section aria-label="Help" className="border-t border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Lightbulb className="size-3.5 shrink-0 text-faint" aria-hidden />
        <h2 className="text-[13px] font-semibold">Help</h2>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => void ask('next')}
          loading={pending === 'next'}
          disabled={busy}
        >
          {hint ? 'More help' : 'Get a hint'}
        </Button>
      </div>

      {/* Any level, directly — but folded away until the first hint, so the
          pinned help area stays one slim row under the problem. */}
      {!hint && (
        <button
          type="button"
          onClick={() => setShowLevels((v) => !v)}
          aria-expanded={showLevels}
          className="mt-1 text-[12px] text-muted underline hover:text-fg"
          title="Hints look at your current code and cost nothing. A solve after help is saved as solved with help."
        >
          {showLevels ? 'Hide levels' : 'Choose a level'}
        </button>
      )}
      <div
        role="group"
        aria-label="Choose how much help"
        hidden={!hint && !showLevels}
        className="mt-2 flex flex-wrap gap-1.5"
      >
        {HINT_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={busy}
            onClick={() => (level === 5 ? setConfirmSolution(true) : void ask('level', { level }))}
            aria-pressed={hint?.level === level}
            className={cn(
              'rounded-xs border px-2 py-1 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50',
              hint?.level === level ? 'border-fg bg-surface-2 text-fg' : 'border-border text-muted hover:text-fg',
            )}
          >
            <span className="tabular font-semibold">{level}</span> {HINT_LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      {confirmSolution && (
        <div
          role="group"
          aria-label="Show the full solution?"
          className="mt-2 rounded-sm border border-border bg-surface-2 p-3 text-[13px]"
        >
          <p>
            This shows a complete worked solution. You can still write it yourself afterwards, and the
            solve will be saved as assisted.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void ask('level', { level: 5 })}
              loading={pending === 'level'}
              disabled={busy}
            >
              Show the solution
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmSolution(false)}>
              Not yet
            </Button>
          </div>
        </div>
      )}

      {hint && (
        <article className="mt-3 rounded-sm border border-border bg-surface p-3" aria-live="polite">
          <p className="text-[11px] font-mono uppercase tracking-wide text-faint">
            Level {hint.level} · {hint.levelLabel}
          </p>

          {codeChanged && (
            <p className="mt-1 text-[12px] text-muted">
              Your code has changed since this hint. Ask again and the next one will look at the new version.
            </p>
          )}
          {hint.resolvedNote && <p className="mt-1 text-[12px] text-success">{hint.resolvedNote}</p>}
          {hint.escalationNote && <p className="mt-1 text-[12px] text-muted">{hint.escalationNote}</p>}

          <dl className="mt-2 space-y-2 text-[13px] leading-relaxed">
            {hint.notice && <Part label="Notice" text={hint.notice} />}
            {hint.explain && <Part label="Explain" text={hint.explain} />}
            {hint.tryThis && <Part label="Try" text={hint.tryThis} />}
          </dl>

          {hint.body?.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mt-2 text-[13px] leading-relaxed">
              <Rich text={paragraph} />
            </p>
          ))}

          {hint.code && (
            <div className="mt-2">
              <p className="text-[11px] font-mono uppercase tracking-wide text-faint">{hint.code.label}</p>
              <pre className="mt-1 overflow-x-auto rounded-xs bg-surface-2 px-2.5 py-2 font-mono text-[12px] leading-relaxed">
                {hint.code.text}
              </pre>
            </div>
          )}

          {hint.trace && (
            <div className="mt-3">
              <p className="text-[12px] font-semibold">
                <Rich text={hint.trace.title} />
              </p>
              <div className="mt-1 overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[12px]">
                  <thead>
                    <tr>
                      {hint.trace.columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="border-b border-border px-2 py-1 text-left font-medium text-faint"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hint.trace.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="border-b border-border px-2 py-1 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hint.trace.divergence && (
                <p className="mt-1.5 text-[13px]">
                  <span className="font-semibold">Where it differs: </span>
                  <Rich text={hint.trace.divergence} />
                </p>
              )}
              <p className="mt-1 text-[11px] text-faint">
                {hint.trace.grounding === 'executed'
                  ? 'Ran your code'
                  : hint.trace.grounding === 'reference'
                    ? 'Checked reference'
                    : 'Illustrative example'}
                {' — '}
                {hint.trace.groundingNote}
              </p>
            </div>
          )}

          {hint.checkUnderstanding && (
            <p className="mt-2 text-[12px] text-muted">
              Afterwards, a small check that it stuck: {hint.checkUnderstanding.title}.{' '}
              {hint.checkUnderstanding.why}
            </p>
          )}

          {/* What this hint is based on, said honestly. */}
          <div className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-faint">
            <p>{hint.evidence.summary}</p>
            {hint.evidence.suspicion && (
              <p>
                {hint.evidence.suspicion.confidence === 'confirmed'
                  ? 'Confirmed by running your code: '
                  : hint.evidence.suspicion.confidence === 'likely'
                    ? 'Likely cause: '
                    : 'Possible cause, from reading the code: '}
                {hint.evidence.suspicion.text}.
              </p>
            )}
            <p>{hint.analysisNote}</p>
          </div>

          {/* Ways to change the help. */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sendHelpful(false);
                void ask('didnt_help');
              }}
              loading={pending === 'didnt_help'}
              disabled={busy}
            >
              That hint didn’t help
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void ask('step_by_step')}
              loading={pending === 'step_by_step'}
              disabled={busy}
            >
              Show the values step by step
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void ask('smaller_example')}
              loading={pending === 'smaller_example'}
              disabled={busy}
            >
              Give me a smaller example
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void ask('different_explanation')}
              loading={pending === 'different_explanation'}
              disabled={busy}
            >
              Show a different explanation
            </Button>
          </div>

          {hint.terms.length > 0 && (
            <form
              className="mt-2 flex flex-wrap items-center gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                if (term) void ask('explain_word', { term });
              }}
            >
              <label htmlFor={termId} className="text-[12px] text-muted">
                Explain this word:
              </label>
              <select
                id={termId}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                className="rounded-xs border border-border bg-bg px-1.5 py-1 text-[12px]"
              >
                <option value="">choose…</option>
                {hint.terms.map((t) => (
                  <option key={t.term} value={t.term}>
                    {t.term}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={!term || busy}
                loading={pending === 'explain_word'}
              >
                Explain
              </Button>
            </form>
          )}

          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
            {rated === null ? (
              <>
                <span>Did this help?</span>
                <button
                  type="button"
                  onClick={() => {
                    setRated(true);
                    sendHelpful(true);
                  }}
                  className="rounded-xs p-1 hover:text-fg"
                  aria-label="Yes, this helped"
                >
                  <ThumbsUp className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRated(false);
                    sendHelpful(false);
                  }}
                  className="rounded-xs p-1 hover:text-fg"
                  aria-label="No, this did not help"
                >
                  <ThumbsDown className="size-3.5" aria-hidden />
                </button>
              </>
            ) : (
              <span>Thanks — noted.</span>
            )}
          </div>
        </article>
      )}

      {earlier.length > 0 && (
        <details className="mt-2 text-[12px] text-muted">
          <summary className="cursor-pointer">Earlier hints ({earlier.length})</summary>
          <ol className="mt-1 space-y-1">
            {earlier.map((h, i) => (
              <li key={i}>
                Level {h.level}: <Rich text={h.tryThis ?? h.notice ?? h.body?.slice(0, 140) ?? h.levelLabel} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function Part({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-[11px] font-mono font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd className="whitespace-pre-wrap">
        <Rich text={text} />
      </dd>
    </div>
  );
}

/** Backticks become inline code; nothing else is interpreted. */
export function Rich({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded-xs bg-surface-2 px-1 font-mono text-[0.92em]">
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
