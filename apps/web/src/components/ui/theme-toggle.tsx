'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Light / dark / system, as a segmented control.
 *
 * The previous two-state toggle had a real flaw: once you clicked it you were
 * pinned to an explicit choice forever, with no way back to following the
 * operating system. Three options make "system" reachable again, and make the
 * current mode visible rather than something inferred from which icon shows.
 *
 * `theme` is what the user picked ('system' included); `resolvedTheme` is what
 * that currently evaluates to. Selection must read from `theme`, or choosing
 * system would light up whichever of light/dark it happened to resolve to.
 */

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // The server cannot know the stored preference, so the selected state is
  // withheld until mount rather than guessed — a wrong guess would flash the
  // wrong segment on every page load.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sm border border-border p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'grid size-7 place-items-center rounded-xs transition-colors',
              selected ? 'bg-surface-2 text-fg' : 'text-faint hover:text-fg',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
