'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { LANGUAGE_LABELS, LANGUAGES, MONACO_LANGUAGE_IDS, type Language } from '@codelock/shared';
import { Skeleton } from '@/components/ui/primitives';

// Monaco touches `window` and `navigator` at import time and ships ~2 MB, so
// it must never be part of the server bundle or the initial payload.
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export function CodeEditor({
  language,
  value,
  onChange,
  onLanguageChange,
  disabled,
}: {
  language: Language;
  value: string;
  onChange: (next: string) => void;
  onLanguageChange: (next: Language) => void;
  disabled?: boolean;
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
          className="h-7 rounded-sm border border-border-strong bg-surface px-2 text-[13px] disabled:opacity-50"
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
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
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
