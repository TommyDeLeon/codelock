'use client';

import { CloudOff } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';

/**
 * One persistent, app-wide statement of "we cannot reach the server".
 *
 * Individual screens still render their own error states — this exists so that
 * a screen with nothing to show cannot be read as a screen with nothing to
 * report. Deliberately not dismissible: the outage is the fact.
 */
export function ConnectionBanner() {
  const connection = useConnection();
  if (connection.status === 'online') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-warning-soft
                 px-4 py-2 text-center text-[13px] text-warning"
    >
      <CloudOff className="size-4 shrink-0" aria-hidden />
      <span>
        {connection.message} Any session you started is still running on the server — retrying.
      </span>
    </div>
  );
}
