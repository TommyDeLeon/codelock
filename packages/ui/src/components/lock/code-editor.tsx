'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { LANGUAGE_LABELS, LANGUAGES, MONACO_LANGUAGE_IDS, type Language } from '@codelock/shared';
import { Skeleton } from '../ui/primitives';

/**
 * Monaco, loaded from this bundle rather than from a CDN.
 *
 * `@monaco-editor/react` defaults to pulling the editor from jsdelivr at
 * runtime. On this app that fails outright — the CSP is `script-src 'self'` —
 * so the editor never initialised and the lock screen had no way to type into
 * it. Even with the CSP widened it would be the wrong dependency: a lock screen
 * that needs a third-party CDN to be reachable is one that traps an offline
 * user behind an editor that will not load.
 *
 * Monaco touches `window` at import time and ships ~2 MB, so all of this stays
 * inside a dynamic, client-only chunk.
 */
const MonacoEditor = dynamic(
  async () => {
    const [{ default: Editor, loader }, monaco] = await Promise.all([
      import('@monaco-editor/react'),
      import('monaco-editor'),
    ]);

    // The base worker handles tokenising and editing for every language. The
    // per-language workers only add IntelliSense, and grading happens on the
    // server, so their absence costs nothing here.
    self.MonacoEnvironment = {
      getWorker: () =>
        new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
          type: 'module',
        }),
    };

    loader.config({ monaco });
    return Editor;
  },
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  },
);

export function CodeEditor({
  language,
  value,
  onChange,
  onLanguageChange,
  disabled,
  languages,
  alwaysDark = false,
}: {
  language: Language;
  value: string;
  onChange: (next: string) => void;
  onLanguageChange: (next: Language) => void;
  disabled?: boolean;
  /**
   * Narrows the languages on offer. Defaults to all of them.
   *
   * The public demo grades in a Web Worker, which can only run JavaScript, so
   * it passes a single-entry list. Offering a Python option there would let a
   * visitor write a perfectly good Python answer and be told it has a syntax
   * error — the worst kind of demo, one that makes the product look broken
   * rather than limited. The lock screen passes nothing and keeps all six.
   */
  languages?: readonly Language[];
  /**
   * Ignore the theme preference and keep the editor dark.
   *
   * The lock screen is dark whatever the site theme says, and Monaco paints its
   * own surface rather than inheriting the page's — so following
   * `resolvedTheme` there produced a white editor sitting in the middle of a
   * dark full-screen takeover. The demo, which does live inside the themed
   * site, leaves this off.
   */
  alwaysDark?: boolean;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <label
          htmlFor="language"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint"
        >
          Language
        </label>
        {/*
          A styled native select, not a custom listbox.

          It rendered as a raw operating-system dropdown — grey, rounded,
          shaded, in an otherwise ink-on-paper interface — and a single
          unstyled control is enough to make everything around it look
          unfinished. `appearance-none` takes the chrome off and the caret is
          drawn here instead.

          Still a real <select>: keyboard behaviour, the mobile wheel, screen
          reader semantics and the OS's own option list all come from the
          platform. A hand-rolled dropdown would trade those for a chevron.
        */}
        <div className="relative">
          <select
            id="language"
            value={language}
            disabled={disabled}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="h-11 appearance-none rounded-none border-b border-border-strong bg-transparent pr-6 pl-0 font-mono text-base tracking-tight
                       hover:border-fg focus-visible:border-fg disabled:opacity-50 sm:h-7 sm:text-[12.5px]"
          >
            {(languages ?? LANGUAGES).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 10 6"
            className="pointer-events-none absolute right-1 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-faint"
          >
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          <kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">Enter</kbd> to submit
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          language={MONACO_LANGUAGE_IDS[language]}
          value={value}
          onChange={(next) => onChange(next ?? '')}
          theme={alwaysDark || resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: disabled,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'line',
            smoothScrolling: true,
            tabSize: 2,
            automaticLayout: true,
            // Tab must move focus, not insert a tab, until the user explicitly
            // opts in with Ctrl+M — otherwise the editor is a keyboard trap.
            tabFocusMode: false,
          }}
        />
      </div>
    </div>
  );
}
