'use client';

import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { isDesktop } from '@/lib/desktop-bridge';
import { Button } from '@/components/ui/button';

/** Mirrors the server bound, so the field refuses before the request does. */
const RESPONSE_LIMIT = 400;

/**
 * Four ways to say something true about the problem in front of you.
 *
 * Too hard, too easy, say it differently, and not tonight. None of them fails
 * the session, spends a skip, or moves the difficulty level. They sit under
 * the hints because they answer the same moment: someone reading, stuck, and
 * deciding what to do next.
 *
 * Plain text buttons, no icons doing the talking and no colour coding. A
 * control for "this is too hard" that looks like a warning is a control people
 * are embarrassed to press.
 */
export function SessionFlowPanel({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const [restatement, setRestatement] = useState<string | null>(null);
  const [activity, setActivity] = useState<{
    question: string;
    stdin: string;
    expectedStdout: string;
  } | null>(null);
  const [response, setResponse] = useState('');
  const responseId = useId();

  // The workspace remounts when the problem changes, so refreshing the active
  // session is all a swap needs: the new problem, its fit note and a fresh
  // hints panel all arrive with it.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lock', 'active'] });

  const swap = useMutation({
    mutationFn: (action: 'too_hard' | 'too_easy') => api.lock.flow.swap(sessionId, action),
    onSuccess: (data, action) => {
      // Said plainly when the band asked for had nothing: another problem at
      // the same level is a fair offer and a dishonest thing to call easier.
      if (data.sameBand) {
        toast.info(
          action === 'too_hard'
            ? 'Nothing smaller was ready, so here is a different problem at the same level.'
            : 'Nothing harder was ready, so here is a different problem at the same level.',
        );
      } else {
        toast.success(action === 'too_hard' ? 'Here is a smaller one.' : 'Here is a bigger one.');
      }
      void refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const restate = useMutation({
    mutationFn: () => api.lock.flow.restate(sessionId),
    onSuccess: (data) => setRestatement(data.text),
    onError: (err: Error) => toast.error(err.message),
  });

  const offer = useMutation({
    mutationFn: () => api.lock.flow.offerActivity(sessionId),
    onSuccess: (data) => {
      setActivity(data);
      setResponse('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const complete = useMutation({
    mutationFn: () => api.lock.flow.completeActivity(sessionId, response),
    onSuccess: (data) => {
      toast.success(data.message, { duration: 8000 });
      // The same rule as skip: in the desktop shell this page must not decide
      // where the window goes. The shell polls, sees the session has ended and
      // drops the overlay itself.
      if (isDesktop()) {
        void refresh();
        return;
      }
      window.location.href = '/';
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const busy = swap.isPending || restate.isPending || offer.isPending || complete.isPending;

  return (
    <section aria-label="Adjust this problem" className="border-t border-border px-5 py-4">
      <h2 className="text-[13px] font-semibold">Not the right problem right now?</h2>
      <p className="mt-1 text-[13px] text-muted">
        None of these count against you or change your level.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => swap.mutate('too_hard')}
          loading={swap.isPending && swap.variables === 'too_hard'}
          disabled={busy}
        >
          Too hard
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => swap.mutate('too_easy')}
          loading={swap.isPending && swap.variables === 'too_easy'}
          disabled={busy}
        >
          Too easy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => restate.mutate()}
          loading={restate.isPending}
          disabled={busy}
          title="Counts as a hint, the same as the ones above"
        >
          Say it differently
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => offer.mutate()}
          loading={offer.isPending}
          disabled={busy || activity !== null}
        >
          Not tonight
        </Button>
      </div>

      {restatement && (
        <p role="status" className="mt-3 rounded-sm border border-border bg-surface-2 p-3 text-[13px]">
          {restatement}
        </p>
      )}

      {activity && (
        <form
          className="mt-3 rounded-sm border border-border bg-surface-2 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (response.trim() && !complete.isPending) complete.mutate();
          }}
        >
          <p className="text-[13px]">
            One example, then you can stop for tonight. It is not graded, and the answer is right
            here.
          </p>
          <div className="mt-2 font-mono text-[12px]">
            <div className="text-faint">input</div>
            <pre className="whitespace-pre-wrap break-all">{activity.stdin}</pre>
            <div className="mt-1.5 text-faint">expected</div>
            <pre className="whitespace-pre-wrap break-all">{activity.expectedStdout}</pre>
          </div>
          <label htmlFor={responseId} className="mt-3 block text-[13px] font-semibold">
            {activity.question}
          </label>
          <textarea
            id={responseId}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            maxLength={RESPONSE_LIMIT}
            rows={3}
            className="mt-1.5 w-full rounded-sm border border-border bg-bg p-2 text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-accent"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              variant="accent"
              loading={complete.isPending}
              disabled={!response.trim()}
            >
              Done for tonight
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setActivity(null)}
              disabled={complete.isPending}
            >
              Back to the problem
            </Button>
            <span className="tabular ml-auto text-[12px] text-faint">
              {response.length}/{RESPONSE_LIMIT}
            </span>
          </div>
        </form>
      )}
    </section>
  );
}
