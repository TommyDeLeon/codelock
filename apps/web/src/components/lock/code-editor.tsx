'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { LANGUAGE_LABELS, LANGUAGES, MONACO_LANGUAGE_IDS, type Language } from '@codelock/shared';
import { Skeleton } from '@/components/ui/primitives';

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
  alwaysDark = false,
}: {
  language: Language;
  value: string;
  onChange: (next: string) => void;
  onLanguageChange: (next: Language) => void;
  disabled?: boolean;
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
        <label htmlFor="language" className="text-[13px] text-muted">
          Language
        </label>
        <select
          id="language"
          value={language}
          disabled={disabled}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="h-11 rounded-sm border border-border-strong bg-surface px-2 text-base disabled:opacity-50 sm:h-7 sm:text-[13px]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[13px] text-faint">
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
