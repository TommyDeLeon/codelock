'use client';

/**
 * Last-resort boundary, for failures in the root layout itself.
 *
 * This one replaces the entire document, so it must render its own <html> and
 * <body> and cannot rely on the app's providers, fonts, or CSS variables —
 * hence the inline styles. It should almost never be seen; if it is, the
 * styling of the page is the least of the problem.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          background: '#0e0e0d',
          color: '#f2f0ec',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>CodeLock failed to load</h1>
        <p style={{ fontSize: '0.875rem', color: '#9a968e', maxWidth: '24rem', margin: 0 }}>
          Reload the page. If this keeps happening, the service may be down.
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.8125rem', color: '#706c65', margin: 0 }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            height: '2.75rem',
            padding: '0 1.5rem',
            borderRadius: 8,
            border: 'none',
            background: '#f2f0ec',
            color: '#0e0e0d',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
