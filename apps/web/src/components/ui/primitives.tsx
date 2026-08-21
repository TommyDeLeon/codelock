import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@codelock/shared';

/* Small, composable primitives. Kept in one file because each is under a dozen
   lines — splitting them across five files would be filing, not architecture. */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-md shadow-card',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-4 pb-3 border-b border-border', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-sm font-semibold tracking-tight', className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: 'bg-success-soft text-success',
  MEDIUM: 'bg-warning-soft text-warning',
  HARD: 'bg-danger-soft text-danger',
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        DIFFICULTY_STYLES[difficulty],
        className,
      )}
    >
      {difficulty}
    </span>
  );
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const tones = {
    neutral: 'bg-surface-2 text-muted',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-surface-2', className)} aria-hidden />;
}

/** Empty states get an action, not just an apology. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div role="status" className="flex flex-col items-center py-10 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center py-10 text-center">
      <h3 className="text-sm font-medium text-danger">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium">
        {label}
      </label>
      {children}
      {/* aria-live so validation errors are announced, not just coloured red. */}
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          // 16px on small screens: iOS Safari zooms the viewport when a focused
          // input is under 16px, and 44px is the minimum comfortable tap target.
          'h-11 w-full rounded-sm border border-border-strong bg-surface px-3 text-base',
          'sm:h-9 sm:text-sm',
          'placeholder:text-faint disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
