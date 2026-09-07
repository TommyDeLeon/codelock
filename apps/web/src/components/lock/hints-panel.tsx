'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

/**
 * Three hints, one at a time.
 *
 * The editorial is gated behind the solve, which is right — it is the answer.
 * But that left someone stuck at minute forty with two moves, abandon or stare,
 * and neither teaches anything. These sit in that gap: they name the idea and
 * never write the code.
 *
 * Revealed one at a time, and *fetched* one at a time. A component that loads
 * all three and renders one has already handed over all three to anyone who
 * opens the network tab, so "progressive" has to be true of the request and not
 * merely of the rendering.
 *
 * No penalty, by decision: charging for help is how a learning tool teaches
 * people not to ask for it. The reveal is written to the learning log instead,
 * because which problems needed help is the most useful thing that log can tell
 * its owner months later.
 */
export function HintsPanel({ sessionId }: { sessionId: string }) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [total, setTotal] = useState(3);

  const remaining = total - revealed.length;

  async function reveal() {
    if (pending || remaining <= 0) return;
    setPending(true);
    try {
      const hint = await api.lock.hint(sessionId, revealed.length);
      // Appended from the previous value rather than written by index: a double
      // click that slips past `pending` must not put hint 2 into slot 1.
      setRevealed((current) => [...current, hint.text]);
      setTotal(hint.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load that hint.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Hints" className="border-t border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-3.5 shrink-0 text-faint" aria-hidden />
        <p className="text-[13px] font-semibold">Hints</p>
        <span className="tabular text-[12px] text-faint">
          {revealed.length} of {total} shown
        </span>
        {remaining > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => void reveal()}
            loading={pending}
          >
            {revealed.length === 0 ? 'Show a hint' : 'Show the next hint'}
          </Button>
        )}
      </div>

      {revealed.length === 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Three nudges, from vaguest to most concrete. They name the idea and never write the code,
          and using them costs you nothing.
        </p>
      ) : (
        <ol className="mt-2 space-y-2">
          {revealed.map((text, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span
                aria-hidden
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-xs bg-surface-2 text-[11px] font-semibold text-muted"
              >
                {i + 1}
              </span>
              <p className="min-w-0">{text}</p>
            </li>
          ))}
        </ol>
      )}

      {remaining === 0 && (
        <p className="mt-2 text-[12px] leading-relaxed text-faint">
          That is all three. The worked solution and the editorial come with the debrief, once this
          session ends.
        </p>
      )}

      {/* One live region, announced on change, rather than each hint shouting
          as it lands. */}
      <p className="sr-only" role="status">
        {revealed.length === 0
          ? 'No hints shown yet.'
          : `Hint ${revealed.length} of ${total}: ${revealed[revealed.length - 1]}`}
      </p>
    </section>
  );
}
