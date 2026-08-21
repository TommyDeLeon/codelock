'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle, Field, Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

/** Sunday first, matching the bitmask where Sunday is bit 0. */
const DAYS = [
  { bit: 0, short: 'S', label: 'Sunday' },
  { bit: 1, short: 'M', label: 'Monday' },
  { bit: 2, short: 'T', label: 'Tuesday' },
  { bit: 3, short: 'W', label: 'Wednesday' },
  { bit: 4, short: 'T', label: 'Thursday' },
  { bit: 5, short: 'F', label: 'Friday' },
  { bit: 6, short: 'S', label: 'Saturday' },
] as const;

const WEEKDAYS = 0b0111110;
const EVERY_DAY = 0b1111111;

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const fromTime = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export function ScheduleCard() {
  const queryClient = useQueryClient();
  const timer = useQuery({ queryKey: ['settings', 'timer'], queryFn: () => api.settings.timer() });

  const [mask, setMask] = useState(EVERY_DAY);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1440);
  const [enabled, setEnabled] = useState(true);

  // Seed local state once the server value arrives, so the controls are
  // editable without a round-trip per keystroke.
  useEffect(() => {
    const c = timer.data?.timerConfig;
    if (!c) return;
    setMask(c.activeDaysMask);
    setFrom(c.activeFromMinute);
    setTo(c.activeToMinute);
    setEnabled(c.enabled);
  }, [timer.data]);

  const save = useMutation({
    mutationFn: () =>
      api.settings.updateTimer({
        enabled,
        activeDaysMask: mask,
        activeFromMinute: from,
        activeToMinute: to,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'timer'] });
      toast.success('Schedule saved.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (timer.isLoading) return <Skeleton className="h-72" />;

  const wraps = from > to;
  const noDays = mask === 0;
  // A zero-length window would silently disable the app while looking enabled.
  const emptyWindow = from === to;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <CalendarClock className="size-4" aria-hidden />
        <CardTitle>When CodeLock can lock you</CardTitle>
      </CardHeader>

      <CardBody className="space-y-5">
        <p className="text-sm text-muted">
          Outside these days and hours, starting a focus block is refused — so CodeLock can never
          interrupt you at 3am or during a meeting. A session that starts inside the window is
          allowed to finish, even if it runs past the end.
        </p>

        <div>
          <label className="flex min-h-11 items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            CodeLock is switched on
          </label>
          {!enabled && (
            <p className="mt-1 text-[13px] text-warning">
              Switched off entirely. No session can be started on any device.
            </p>
          )}
        </div>

        <fieldset disabled={!enabled} className="disabled:opacity-50">
          <legend className="mb-2 text-[13px] font-medium">Active days</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const on = (mask & (1 << day.bit)) !== 0;
              return (
                <button
                  key={day.label}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={day.label}
                  onClick={() => setMask(mask ^ (1 << day.bit))}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-sm border text-[13px] font-medium transition-colors',
                    on
                      ? 'border-fg bg-fg text-bg'
                      : 'border-border-strong bg-surface text-muted hover:text-fg',
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setMask(WEEKDAYS)}>
              Weekdays
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMask(EVERY_DAY)}>
              Every day
            </Button>
          </div>

          {noDays && (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              No days selected — CodeLock will never lock you.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="activeFrom">
              <input
                id="activeFrom"
                type="time"
                value={toTime(from)}
                onChange={(e) => setFrom(fromTime(e.target.value))}
                className="h-11 w-full rounded-sm border border-border-strong bg-surface px-3 text-base sm:h-9 sm:text-sm"
              />
            </Field>
            <Field label="Until" htmlFor="activeTo">
              <input
                id="activeTo"
                type="time"
                value={toTime(to === 1440 ? 1439 : to)}
                onChange={(e) => setTo(fromTime(e.target.value))}
                className="h-11 w-full rounded-sm border border-border-strong bg-surface px-3 text-base sm:h-9 sm:text-sm"
              />
            </Field>
          </div>

          {wraps && (
            <p className="mt-2 text-[13px] text-muted">
              This window crosses midnight, so it runs from {toTime(from)} one day until{' '}
              {toTime(to)} the next.
            </p>
          )}
          {emptyWindow && (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              Start and end are the same, which leaves no active time at all.
            </p>
          )}
        </fieldset>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <p className="text-[13px] text-faint">
            Times are in your own timezone, taken from your profile.
          </p>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={emptyWindow}>
            Save schedule
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
