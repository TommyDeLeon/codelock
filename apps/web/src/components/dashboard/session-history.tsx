'use client';

import { CircleCheck, CircleSlash, SkipForward } from 'lucide-react';
import type { StatsSummary } from '@codelock/shared';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DifficultyBadge,
  EmptyState,
} from '@/components/ui/primitives';
import { formatCompact, formatRelative } from '@/lib/utils';

type Session = StatsSummary['locks']['recent'][number];

export function SessionHistory({ sessions }: { sessions: Session[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent locks</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        {sessions.length === 0 ? (
          <EmptyState
            title="No locks yet"
            description="Start a focus block; when the timer ends you will get a problem here."
          />
        ) : (
          <ul role="list" className="divide-y divide-border">
            {sessions.slice(0, 8).map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function SessionRow({ session }: { session: Session }) {
  const outcome = describeOutcome(session);
  const duration =
    session.lockedAt && session.resolvedAt
      ? (new Date(session.resolvedAt).getTime() - new Date(session.lockedAt).getTime()) / 1000
      : null;

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {/* Icon plus text: state is never conveyed by colour alone. */}
      <span className={`shrink-0 [&_svg]:size-4 ${outcome.className}`}>{outcome.icon}</span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{session.problem?.title ?? 'Problem unavailable'}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          <span className={outcome.className}>{outcome.label}</span>
          {duration !== null && <> · {formatCompact(duration)}</>}
          {session.attempts > 1 && <> · {session.attempts} attempts</>}
        </p>
      </div>

      <DifficultyBadge difficulty={session.difficulty} className="shrink-0" />
      <time
        className="w-16 shrink-0 text-right text-[13px] text-faint"
        dateTime={session.resolvedAt ?? undefined}
      >
        {formatRelative(session.resolvedAt)}
      </time>
    </li>
  );
}

function describeOutcome(session: Session) {
  switch (session.state) {
    case 'UNLOCKED':
      return { icon: <CircleCheck aria-hidden />, label: 'Solved', className: 'text-success' };
    case 'BYPASSED':
      return { icon: <SkipForward aria-hidden />, label: 'Skipped', className: 'text-warning' };
    default:
      return { icon: <CircleSlash aria-hidden />, label: 'Unfinished', className: 'text-muted' };
  }
}
