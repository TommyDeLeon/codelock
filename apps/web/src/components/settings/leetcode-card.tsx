'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Code2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { failureOf } from '@/lib/query-result';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@/components/ui/primitives';
import { formatRelative } from '@/lib/utils';

export function LeetCodeCard() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');

  const list = useQuery({ queryKey: ['integrations'], queryFn: () => api.integrations.list() });
  const leetcode = list.data?.integrations.find((i) => i.provider === 'LEETCODE');

  const stats = useQuery({
    queryKey: ['integrations', 'leetcode', 'stats'],
    queryFn: () => api.integrations.leetcodeStats(),
    enabled: Boolean(leetcode),
    retry: false,
  });

  // A paused retry has no `error` set; `failureOf` sees it. Without this a
  // hidden tab sits on the empty state through an outage.
  const statsFailure = stats.data ? null : failureOf(stats);

  const link = useMutation({
    mutationFn: (name: string) => api.integrations.linkLeetcode(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('LeetCode profile linked.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const refresh = useMutation({
    mutationFn: () => api.integrations.leetcodeStats(true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations', 'leetcode'] }),
  });

  const disconnect = useMutation({
    mutationFn: () => api.integrations.disconnect('LEETCODE'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const solved = stats.data?.stats.solved;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Code2 className="size-4" aria-hidden />
        <CardTitle>LeetCode</CardTitle>
        {leetcode ? (
          <Badge tone="success" className="ml-auto">
            {leetcode.externalUsername}
          </Badge>
        ) : (
          <Badge className="ml-auto">Not linked</Badge>
        )}
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Stated plainly rather than discovered later: this direction is
            one-way, and no product can make it otherwise. */}
        <p className="text-sm text-muted">
          Imports your public LeetCode stats so they sit alongside your CodeLock progress.
        </p>
        <p className="rounded-sm bg-surface-2 px-3 py-2 text-[13px] text-muted">
          <strong className="font-medium text-fg">Read-only.</strong> LeetCode publishes no public
          write API, so solving a problem here cannot mark it solved there. Nothing is sent to
          LeetCode and no password is required.
        </p>

        {!leetcode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) link.mutate(username.trim());
            }}
            className="space-y-2"
          >
            <Field
              label="LeetCode username"
              htmlFor="leetcodeUsername"
              hint="Your profile must be public for stats to load."
            >
              <Input
                id="leetcodeUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jane-doe"
                autoComplete="username"
              />
            </Field>
            <Button type="submit" loading={link.isPending}>
              Link profile
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {statsFailure ? (
              <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-[13px] text-danger">
                Could not load stats. LeetCode&apos;s endpoint is unofficial and occasionally
                changes; CodeLock keeps working regardless.
              </p>
            ) : solved ? (
              <>
                {stats.data?.stale && (
                  <p className="text-[13px] text-warning">
                    Showing the last successful snapshot — LeetCode did not respond.
                  </p>
                )}
                <dl className="grid grid-cols-4 gap-2 text-center">
                  <SolvedStat label="Easy" value={solved.easy} tone="text-success" />
                  <SolvedStat label="Medium" value={solved.medium} tone="text-warning" />
                  <SolvedStat label="Hard" value={solved.hard} tone="text-danger" />
                  <SolvedStat label="Total" value={solved.total} tone="text-fg" />
                </dl>
                <p className="text-[13px] text-muted">
                  <strong className="font-medium text-fg tabular">
                    {stats.data?.stats.streakDays ?? 0}
                  </strong>{' '}
                  day streak ·{' '}
                  <strong className="font-medium text-fg tabular">
                    {stats.data?.stats.totalActiveDays ?? 0}
                  </strong>{' '}
                  active days
                </p>
              </>
            ) : null}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[13px] text-faint">
                Updated {formatRelative(leetcode.lastSyncAt)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refresh.mutate()}
                  loading={refresh.isPending}
                >
                  <RefreshCw aria-hidden />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm" onClick={() => disconnect.mutate()}>
                  Unlink
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function SolvedStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-sm border border-border py-2">
      <dt className="text-[11px] uppercase tracking-wider text-faint">{label}</dt>
      <dd className={`tabular mt-0.5 text-lg font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
