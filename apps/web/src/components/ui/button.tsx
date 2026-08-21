import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const button = cva(
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap ' +
    'transition-colors disabled:pointer-events-none disabled:opacity-50 ' +
    '[&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-fg text-bg hover:bg-fg/90',
        accent: 'bg-accent text-accent-fg hover:bg-accent/90',
        outline: 'border border-border-strong bg-surface hover:bg-surface-2',
        ghost: 'hover:bg-surface-2 text-muted hover:text-fg',
        danger: 'bg-danger text-white hover:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] rounded-sm',
        md: 'h-9 px-4 text-sm rounded-sm',
        lg: 'h-11 px-6 text-[15px] rounded-md',
        icon: 'size-9 rounded-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Renders a spinner and blocks clicks. Keeps width stable to avoid layout shift. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      disabled={disabled ?? loading}
      // Screen readers should hear that the action is in progress, not just
      // find a silently disabled control.
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
