import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Accomplishment,
  GradeResult,
  HintView,
  Language,
  LearnRecommendationView,
  LearnView,
  LessonCheckResultView,
  LessonPracticeView,
  LessonSessionView,
  LessonView,
} from '@codelock/shared';
import { LANGUAGES, LANGUAGE_LABELS } from '@codelock/shared';
import { api, ApiError } from '../api';
import { openExternal } from '../bridge';
import { chime, readCelebrationPrefs } from '../celebration';

/**
 * Learn: one recommended lesson with the reason for it, an optional review,
 * and the list of topics. Then the lesson itself, one step at a time.
 *
 * Nothing here can touch a lock. The practice step grades through the Learn
 * routes, which have no lock session in their shape, and the screen holds no
 * lock state at all. When a timer fires the main process replaces this
 * renderer with the lock shell; the lesson's state is on the server and in
 * localStorage, so coming back finds it where it was.
 *
 * Every state the server can be in has its own words: unreachable is not
 * "no history", "no history" is not "history unavailable", and a judge
 * outage on a task is not a wrong answer.
 */

const LANGUAGE_KEY = 'codelock.learn.language';
const draftKey = (lessonId: string) => `codelock.learn.draft.${lessonId}`;

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 14px',
  fontSize: 13,
  background: 'var(--surface)',
};

const measure: React.CSSProperties = { maxWidth: 680 };

const codeBlock: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 12.5,
  lineHeight: 1.5,
  margin: 0,
  padding: '10px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  background: 'var(--surface-2)',
  overflowX: 'auto',
  whiteSpace: 'pre',
  tabSize: 4,
};

const editor: React.CSSProperties = {
  ...codeBlock,
  width: '100%',
  minHeight: 180,
  resize: 'vertical',
  color: 'var(--fg)',
  boxSizing: 'border-box',
};

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Kept on the server too; this is only the offline copy.
  }
}

function isLanguage(value: string | null): value is Language {
  return (LANGUAGES as readonly string[]).includes(value ?? '');
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Words for a failure, by what actually failed. */
function describeError(err: unknown, fallback: string): { text: string; kind: 'unreachable' | 'judge' | 'stale' | 'other' } {
  if (err instanceof ApiError) {
    if (err.status === 0) return { text: 'Cannot reach CodeLock. Check that the server is running, then try again. Nothing you did here is lost.', kind: 'unreachable' };
    if (err.status === 502 || err.status === 503) return { text: 'The code runner is not available right now. Your answer is kept; try again in a moment.', kind: 'judge' };
    if (err.status === 409 && err.code === 'STALE_SESSION') return { text: 'This lesson moved on in another window. Reloaded to the newer state.', kind: 'stale' };
    return { text: err.message, kind: 'other' };
  }
  return { text: fallback, kind: 'other' };
}

function sessionFromStale(err: unknown): LessonSessionView | null {
  if (err instanceof ApiError && err.status === 409) {
    const body = err.body as { session?: LessonSessionView } | null;
    return body?.session ?? null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Learn home
// ---------------------------------------------------------------------------

export function LearnScreen() {
  const [language, setLanguage] = useState<Language | null>(() => {
    const stored = readStored(LANGUAGE_KEY);
    return isLanguage(stored) ? stored : null;
  });
  const [view, setView] = useState<LearnView | null>(null);
  const [error, setError] = useState<ReturnType<typeof describeError> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  // The preferred language from settings, unless this screen has its own.
  useEffect(() => {
    if (language) return;
    api
      .profile()
      .then(({ profile }) => setLanguage(profile.preferredLanguage))
      .catch(() => setLanguage('JAVASCRIPT'));
  }, [language]);

  // Each load gets a ticket; a response for an older ticket is dropped, so
  // switching language twice quickly cannot show the first language's view.
  const ticket = useRef(0);
  const load = useCallback(async () => {
    if (!language) return;
    const mine = ++ticket.current;
    setError(null);
    try {
      const next = await api.learn.view(language);
      if (mine === ticket.current) setView(next);
    } catch (err) {
      if (mine === ticket.current) setError(describeError(err, 'Could not load Learn.'));
    }
  }, [language]);

  useEffect(() => {
    void load();
    return () => {
      ticket.current += 1;
    };
  }, [load]);

  const choose = (next: Language) => {
    writeStored(LANGUAGE_KEY, next);
    setLanguage(next);
    setView(null);
  };

  if (open && language) {
    return (
      <LessonFlow
        lessonId={open}
        language={language}
        onClose={() => {
          setOpen(null);
          void load();
        }}
      />
    );
  }

  if (!language || (!view && !error)) {
    return <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>Loading Learn…</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          Language
          <select value={language} onChange={(e) => choose(e.target.value as Language)} style={{ font: 'inherit' }}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </option>
            ))}
          </select>
        </label>
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>
          Concepts carry across languages; the examples and what counts as applied are per language.
        </span>
      </div>

      {error && (
        <div role="alert" style={{ ...card, ...measure, borderColor: 'var(--danger)' }}>
          <p style={{ margin: 0 }}>{error.text}</p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {view && (
        <>
          {view.history === 'unavailable' && (
            <div role="status" style={{ ...card, ...measure, borderColor: 'var(--warning)' }}>
              <p style={{ margin: 0 }}>
                Your history could not be read just now, so this is not a personal pick. Everything you have done is
                still saved.
              </p>
              <button type="button" className="btn btn-quiet" style={{ marginTop: 8 }} onClick={() => void load()}>
                Try again
              </button>
            </div>
          )}

          <RecommendationCard rec={view.primary} heading="Recommended next" primary onOpen={(id) => setOpen(id)} language={language} />

          {view.review && (
            <RecommendationCard rec={view.review} heading="A short review is ready" onOpen={(id) => setOpen(id)} language={language} />
          )}

          <TopicList
            id="learn-patterns"
            title="Patterns"
            intro="The techniques behind the problems the lock serves, each with the code you would write in your language. Reached from the problem you last met, or from here."
            topics={view.topics.filter((t) => t.family)}
            onOpen={(id) => setOpen(id)}
          />

          <TopicList
            id="learn-topics"
            title="Foundations"
            intro="The eight foundation skills, in teaching order. Opening one is a choice, not a test; the state beside each is what your solves have shown so far."
            topics={view.topics.filter((t) => !t.family)}
            onOpen={(id) => setOpen(id)}
            footer={
              <button
                type="button"
                className="btn btn-quiet"
                disabled={placing}
                onClick={async () => {
                  setPlacing(true);
                  try {
                    await api.learn.placement();
                    await load();
                  } catch (err) {
                    setError(describeError(err, 'That was not recorded.'));
                  }
                  setPlacing(false);
                }}
              >
                I already know the foundations
              </button>
            }
          />

          <section aria-labelledby="learn-resources">
            <h2 id="learn-resources" style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
              After the foundations
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', ...measure }}>
              There is no in-app lesson for these yet. Each is a reading list of reviewed material, not a lesson; the
              lock keeps serving problems in them.
            </p>
            <ResourceList resources={view.resources} />
          </section>
        </>
      )}
    </div>
  );
}

function TopicList({
  id,
  title,
  intro,
  topics,
  onOpen,
  footer,
}: {
  id: string;
  title: string;
  intro: string;
  topics: LearnView['topics'];
  onOpen: (id: string) => void;
  footer?: React.ReactNode;
}) {
  if (topics.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', ...measure }}>{intro}</p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {topics.map((topic) => (
          <li key={topic.id} style={card}>
            <p style={{ margin: 0, fontWeight: 500 }}>{topic.title}</p>
            <p style={{ margin: '2px 0 8px', color: 'var(--muted)' }}>
              {topic.family ? topic.family.replace(/_/g, ' ').toLowerCase() : topic.skillLabel} · {topic.skillStateLabel}
            </p>
            <button type="button" className="btn btn-quiet" onClick={() => onOpen(topic.id)}>
              Open lesson
            </button>
          </li>
        ))}
      </ul>
      {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
    </section>
  );
}

function RecommendationCard({
  rec,
  heading,
  primary = false,
  onOpen,
  language,
}: {
  rec: LearnRecommendationView;
  heading: string;
  primary?: boolean;
  onOpen: (id: string) => void;
  language: Language;
}) {
  return (
    <section aria-label={heading} style={{ ...card, ...measure, borderColor: primary ? 'var(--accent)' : 'var(--border)' }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--faint)',
        }}
      >
        {heading}
      </p>
      {rec.lesson ? (
        <>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: '4px 0 2px' }}>{rec.lesson.title}</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            {rec.lesson.skillLabel} · {rec.lesson.skillStateLabel}
          </p>
        </>
      ) : (
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: '4px 0 2px' }}>Nothing new to teach in-app yet</h2>
      )}
      <p style={{ margin: '10px 0 0' }}>{rec.reason}</p>
      {rec.fluencyNote && <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>{rec.fluencyNote}</p>}
      {rec.lesson && !rec.variantAvailable && (
        <p style={{ margin: '8px 0 0', color: 'var(--warning)' }}>
          There is no reviewed {LANGUAGE_LABELS[language]} version of this lesson yet. Choose another language above, or
          read the shared explanation without the examples.
        </p>
      )}
      {rec.lesson && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className={primary ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => onOpen(rec.lesson!.id)}>
            {rec.reasonCode === 'resumed' ? 'Continue' : rec.reasonCode === 'review' ? 'Review' : rec.reasonCode === 'problem' ? 'Learn the technique' : 'Start'}
          </button>
        </div>
      )}
    </section>
  );
}

function ResourceList({ resources }: { resources: LearnView['resources'] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {resources.map((entry) => (
        <li key={entry.family} style={card}>
          <p style={{ margin: 0, fontWeight: 500 }}>{entry.title}</p>
          <p style={{ margin: '2px 0 6px', color: 'var(--muted)' }}>{entry.summary}</p>
          <SourceLinks sources={entry.resources} />
        </li>
      ))}
    </ul>
  );
}

function SourceLinks({ sources }: { sources: Array<{ title: string; url: string; section: string; publisher: string }> }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2 }}>
      {sources.map((s) => (
        <li key={s.url + s.section} style={{ fontSize: 12.5 }}>
          <button
            type="button"
            onClick={() => openExternal(s.url)}
            style={{ font: 'inherit', background: 'none', border: 'none', padding: 0, color: 'var(--fg)', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}
            aria-label={`${s.title}, ${s.section}, opens in your browser`}
          >
            {s.title}
          </button>
          <span style={{ color: 'var(--muted)' }}> — {s.section} ({s.publisher})</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Lesson flow
// ---------------------------------------------------------------------------

const STEP = { idea: 0, example: 1, prediction: 2, task: 3, practice: 4, done: 5 } as const;
const STEP_NAMES = ['The idea', 'A worked example', 'Predict', 'Fix a small program', 'A different problem', 'Done'];

type Writer = <T>(action: (version: number) => Promise<T & { session: LessonSessionView }>) => Promise<T | null>;

function LessonFlow({ lessonId, language, onClose }: { lessonId: string; language: Language; onClose: () => void }) {
  const [lesson, setLesson] = useState<LessonView | null>(null);
  const [session, setSession] = useState<LessonSessionView | null>(null);
  const [error, setError] = useState<ReturnType<typeof describeError> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The latest session, readable from inside a queued write without the
  // closure it was created in; and whether this flow is still mounted.
  const sessionRef = useRef<LessonSessionView | null>(null);
  sessionRef.current = session;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { lesson: l, session: s } = await api.learn.lesson(lessonId, language);
      if (!mounted.current) return;
      setLesson(l);
      if (s && s.status === 'active' && s.language === language) {
        setSession(s);
      } else {
        const { session: started } = await api.learn.start(lessonId, language);
        if (mounted.current) setSession(started);
      }
    } catch (err) {
      if (mounted.current) setError(describeError(err, 'Could not open the lesson.'));
    }
  }, [lessonId, language]);

  useEffect(() => {
    void load();
  }, [load]);

  // Focus lands on the title once the lesson is actually on screen, which is
  // after both the content and the session have arrived, not before.
  const ready = Boolean(lesson && session);
  useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [ready, lesson?.id]);

  /**
   * Every write goes through here, one at a time. Writes are queued so a
   * draft save that is still in flight cannot race a finish for the same
   * row version, and each one reads the version the previous write left
   * behind rather than the one its caller closed over. A stale version is
   * reconciled in one place.
   */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const write = useCallback(
    <T,>(action: (version: number) => Promise<T & { session: LessonSessionView }>): Promise<T | null> => {
      const run = queue.current.then(async (): Promise<T | null> => {
        const current = sessionRef.current;
        if (!current) return null;
        if (mounted.current) setError(null);
        try {
          const result = await action(current.version);
          sessionRef.current = result.session;
          if (mounted.current) setSession(result.session);
          return result;
        } catch (err) {
          const reconciled = sessionFromStale(err);
          if (reconciled) {
            sessionRef.current = reconciled;
            if (mounted.current) setSession(reconciled);
          }
          if (mounted.current) setError(describeError(err, 'That did not save.'));
          return null;
        }
      });
      queue.current = run.catch(() => undefined);
      return run;
    },
    [],
  );

  const advance = (to: number) => {
    if (!session || to <= session.step) return;
    void write((version) => api.learn.draft(lessonId, { version, step: to }));
  };

  const correction = async (kind: 'known' | 'too_hard') => {
    if (busy) return;
    setBusy(true);
    try {
      await api.learn.correction(lessonId, kind);
    } catch (err) {
      setError(describeError(err, 'That was not recorded.'));
      setBusy(false);
      return;
    }
    if (kind === 'known') {
      setNotice('Noted. A quick check is the honest way to confirm it: answer the prediction below. Your skill map only moves on solves, not on this.');
      advance(STEP.prediction);
      setBusy(false);
    } else {
      setNotice('Noted. The next recommendation steps back to what this builds on.');
      onClose();
    }
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    const done = await write((version) => api.learn.finish(lessonId, version));
    if (done) {
      writeStored(draftKey(lessonId), null);
      onClose();
      return;
    }
    setBusy(false);
  };

  if (error && !lesson) {
    return (
      <div role="alert" style={{ ...card, ...measure }}>
        <p style={{ margin: 0 }}>{error.text}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Try again
          </button>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Back to Learn
          </button>
        </div>
      </div>
    );
  }
  if (!lesson || !session) {
    return <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>Opening the lesson…</p>;
  }

  const step = session.step;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <nav aria-label="Lesson" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          ← Back to Learn
        </button>
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>
          {LANGUAGE_LABELS[language]} · {STEP_NAMES[Math.min(step, STEP.done)]}
        </span>
      </nav>

      <header style={measure}>
        <p style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--faint)' }}>
          {lesson.skillLabel}
        </p>
        <h2 ref={headingRef} tabIndex={-1} style={{ fontSize: 20, fontWeight: 600, margin: '4px 0 6px', outline: 'none' }}>
          {lesson.title}
        </h2>
        <p style={{ margin: 0, fontSize: 13 }}>
          <strong>You will be able to:</strong> {lesson.objective}
        </p>
        {lesson.prerequisites.length > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>Builds on: {lesson.prerequisites.join(', ').toLowerCase()}.</p>
        )}
      </header>

      {error && (
        <p role="alert" style={{ ...card, ...measure, margin: 0, borderColor: error.kind === 'stale' ? 'var(--warning)' : 'var(--danger)' }}>
          {error.text}
        </p>
      )}
      {notice && (
        <p role="status" style={{ ...card, ...measure, margin: 0 }}>
          {notice}
        </p>
      )}

      {/* Teach first: the idea and the complete example are always on screen.
          The checks and practice below are optional and can be skipped; nothing
          about the explanation depends on answering them. */}
      <IdeaStep lesson={lesson} />

      <ExampleStep lesson={lesson} />

      <PredictionStep lesson={lesson} session={session} write={write} lessonId={lessonId} onContinue={() => advance(STEP.task)} />

      <TaskStep lesson={lesson} session={session} write={write} lessonId={lessonId} onContinue={() => advance(STEP.practice)} />

      {step >= STEP.practice && <PracticeStep lessonId={lessonId} language={language} onContinue={() => advance(STEP.done)} />}

      {step >= STEP.done && (
        <section aria-labelledby="lesson-done" style={{ ...card, ...measure }}>
          <h3 id="lesson-done" style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
            That is the lesson
          </h3>
          <p style={{ margin: '0 0 8px' }}>
            Reading and the checks are recorded as participation. What moves the skill map is solving problems that
            need this without help, on separate occasions — the practice step is one, the next lock may be another, and
            the review card brings it back after a week.
          </p>
          <p style={{ margin: '0 0 4px', fontWeight: 500 }}>Further reading</p>
          <SourceLinks sources={[...lesson.sources, ...lesson.variant.sources]} />
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void finish()}>
          Finish for now
        </button>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => void correction('known')}>
          I know this
        </button>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => void correction('too_hard')}>
          This is too hard
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Choose another topic
        </button>
      </div>
    </div>
  );
}

function StepSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} style={{ ...card, ...measure }}>
      <h3 id={id} style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

type Depth = 'beginner' | 'concise' | 'bridge';

/**
 * The explanation, at the depth the evidence suggests and any depth the
 * learner asks for. Nothing here is hidden behind a check: the full
 * explanation, the refresher and the other-angle version are all one click
 * apart, and prerequisites the evidence calls unmet are explained in place.
 */
function IdeaStep({ lesson }: { lesson: LessonView }) {
  const inferred: Depth = lesson.depth ?? 'beginner';
  const [depth, setDepth] = useState<Depth>(inferred);
  const [alternate, setAlternate] = useState(false);
  const concise = depth !== 'beginner' && lesson.refresher;
  const text = alternate ? lesson.alternate : concise ? lesson.refresher! : lesson.explanation;
  return (
    <StepSection id="step-idea" title="The idea">
      {inferred !== 'beginner' && (
        <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>
          {inferred === 'bridge'
            ? `You have applied this before, in another language. Here is the short version, and the ${LANGUAGE_LABELS[lesson.language]} you would write for it is below the example.`
            : 'You have practised this. Here is the short version; the full explanation is one click away.'}
        </p>
      )}
      <p style={{ margin: 0 }}>{text}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {lesson.refresher && (
          <button
            type="button"
            className="btn btn-chip"
            aria-pressed={depth === 'beginner'}
            onClick={() => {
              setAlternate(false);
              setDepth((d) => (d === 'beginner' ? (inferred === 'beginner' ? 'concise' : inferred) : 'beginner'));
            }}
          >
            {depth === 'beginner' ? 'Shorter' : 'More detail'}
          </button>
        )}
        <button type="button" className="btn btn-chip" aria-pressed={alternate} onClick={() => setAlternate((v) => !v)}>
          {alternate ? 'Back to the explanation' : 'Explain another way'}
        </button>
      </div>
      {lesson.primers && lesson.primers.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 500 }}>Before this</p>
          <p style={{ margin: '0 0 6px', color: 'var(--muted)' }}>
            This lesson uses {lesson.primers.map((p) => p.label.toLowerCase()).join(' and ')}, which your solves have not shown yet. The short version of each is here; the full lesson is a separate topic.
          </p>
          {lesson.primers.map((p) => (
            <details key={p.skill} style={{ marginBottom: 6 }}>
              <summary style={{ cursor: 'pointer' }}>{p.title}</summary>
              <p style={{ margin: '6px 0 0' }}>{p.explanation}</p>
              <p style={{ margin: '8px 0 0', fontWeight: 500 }}>{p.smaller.description}</p>
              <Trace steps={p.smaller.trace} />
            </details>
          ))}
        </div>
      )}
      {lesson.terms && lesson.terms.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: 'pointer' }}>Explain a term ({lesson.terms.length})</summary>
          <dl style={{ margin: '8px 0 0', display: 'grid', gap: 6 }}>
            {lesson.terms.map((t) => (
              <div key={t.term}>
                <dt style={{ fontWeight: 500, display: 'inline' }}>{t.term}: </dt>
                <dd style={{ margin: 0, display: 'inline' }}>{t.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </StepSection>
  );
}

function Trace({ steps }: { steps: Array<{ label: string; text: string }> }) {
  return (
    <ol style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
      {steps.map((s, i) => (
        <li key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 140px) 1fr', gap: 10, fontSize: 13 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--faint)', paddingTop: 2 }}>{s.label}</span>
          <span>{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

function ExampleStep({ lesson, onContinue }: { lesson: LessonView; onContinue?: () => void }) {
  const [smaller, setSmaller] = useState(false);
  const [output, setOutput] = useState(true);
  return (
    <StepSection id="step-example" title="A worked example">
      <pre style={codeBlock} aria-label={`Example in ${LANGUAGE_LABELS[lesson.language]}`}>
        <code>{lesson.variant.example.code}</code>
      </pre>
      {lesson.variant.note && <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>{lesson.variant.note}</p>}
      {lesson.variant.syntax && (
        <>
          <p style={{ margin: '12px 0 4px', fontWeight: 500 }}>The pieces in {LANGUAGE_LABELS[lesson.language]}</p>
          <p style={{ margin: '0 0 6px', color: 'var(--muted)' }}>
            Not the answer: the constructs this technique needs, each with what it does. The same lines appear in a
            hint on a lock problem that uses them.
          </p>
          <pre style={codeBlock} aria-label={`Constructs in ${LANGUAGE_LABELS[lesson.language]}`}>
            <code>{lesson.variant.syntax}</code>
          </pre>
        </>
      )}
      <p style={{ margin: '12px 0 0', fontWeight: 500 }}>{smaller ? `Smaller: ${lesson.smaller.description}` : 'Step by step'}</p>
      <Trace steps={smaller ? lesson.smaller.trace : lesson.trace} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-chip" aria-pressed={smaller} onClick={() => setSmaller((v) => !v)}>
          {smaller ? 'Back to the full example' : 'Show a smaller example'}
        </button>
        <button type="button" className="btn btn-chip" aria-pressed={output} onClick={() => setOutput((v) => !v)}>
          {output ? 'Hide output' : 'Show what it prints'}
        </button>
        {onContinue && (
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Continue
          </button>
        )}
      </div>
      {output && (
        <pre style={{ ...codeBlock, marginTop: 8 }} aria-label="Output">
          <code>{lesson.variant.example.stdout}</code>
        </pre>
      )}
    </StepSection>
  );
}

function latestCheck(session: LessonSessionView, kind: 'prediction' | 'task'): LessonCheckResultView | null {
  return (
    Object.values(session.checks)
      .filter((c) => c.kind === kind)
      .sort((a, b) => b.at.localeCompare(a.at))[0] ?? null
  );
}

function CheckResult({ result, label }: { result: LessonCheckResultView; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [result.attemptId]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-label={label}
      style={{ marginTop: 10, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', outline: 'none' }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>{result.correct ? 'Right.' : 'Not quite.'}</p>
      {result.explanation && <p style={{ margin: '4px 0 0' }}>{result.explanation}</p>}
      {result.stdout !== null && result.stdout !== undefined && (
        <pre style={{ ...codeBlock, marginTop: 6 }} aria-label="What it printed">
          <code>{result.stdout || '(nothing)'}</code>
        </pre>
      )}
      {result.stderr && (
        <pre style={{ ...codeBlock, marginTop: 6 }} aria-label="Error output">
          <code>{result.stderr}</code>
        </pre>
      )}
    </div>
  );
}

function PredictionStep({
  lesson,
  session,
  write,
  lessonId,
  onContinue,
}: {
  lesson: LessonView;
  session: LessonSessionView;
  write: Writer;
  lessonId: string;
  onContinue: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const result = latestCheck(session, 'prediction');

  const submit = async () => {
    if (choice === null) return;
    setBusy(true);
    await write((version) =>
      api.learn.check(lessonId, { attemptId: crypto.randomUUID(), version, kind: 'prediction', checkId: lesson.check.id, answer: choice }),
    );
    setBusy(false);
  };

  return (
    <StepSection id="step-predict" title="Optional: check your understanding">
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 13, marginBottom: 8 }}>{lesson.check.question}</legend>
        <div style={{ display: 'grid', gap: 6 }}>
          {lesson.check.options.map((option, i) => (
            <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
              <input type="radio" name={`check-${lesson.check.id}`} value={i} checked={choice === i} onChange={() => setChoice(i)} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" disabled={choice === null || busy} onClick={() => void submit()}>
          {busy ? 'Checking…' : 'Check my answer'}
        </button>
        {!result && (
          <button type="button" className="btn btn-quiet" onClick={onContinue}>
            Skip this check
          </button>
        )}
      </div>
      {result && <CheckResult result={result} label="Prediction result" />}
    </StepSection>
  );
}

function TaskStep({
  lesson,
  session,
  write,
  lessonId,
  onContinue,
}: {
  lesson: LessonView;
  session: LessonSessionView;
  write: Writer;
  lessonId: string;
  onContinue: () => void;
}) {
  const [code, setCode] = useState<string>(
    () => session.draft.task ?? readStored(draftKey(lessonId)) ?? lesson.variant.task.starter,
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const result = latestCheck(session, 'task');
  const timer = useRef<number | null>(null);
  // What has been typed but not yet sent, so an unmount can flush it.
  const pending = useRef<string | null>(null);
  const draftRef = useRef(session.draft);
  draftRef.current = session.draft;

  const flush = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    void write((version) => api.learn.draft(lessonId, { version, draft: { ...draftRef.current, task: next } })).then((r) =>
      setSaved(r ? 'saved' : 'idle'),
    );
  }, [lessonId, write]);

  // Whatever is still pending when this step leaves the screen is sent
  // then, so navigating away a moment after typing does not leave the last
  // keystrokes only in localStorage.
  useEffect(() => flush, [flush]);

  // Draft: to localStorage at once, to the server a second after typing
  // stops. Both, because a restart must lose nothing and the server copy is
  // what another window or a reinstall sees.
  const onChange = (next: string) => {
    setCode(next);
    writeStored(draftKey(lessonId), next);
    setSaved('saving');
    pending.current = next;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 1000);
  };

  const run = async () => {
    setBusy(true);
    flush();
    await write((version) =>
      api.learn.check(lessonId, { attemptId: crypto.randomUUID(), version, kind: 'task', checkId: 'task', sourceCode: code }),
    );
    setBusy(false);
  };

  return (
    <StepSection id="step-task" title="Optional: fix a small program">
      <p style={{ margin: '0 0 8px' }}>{lesson.variant.task.prompt}</p>
      <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>
        It should print exactly:{' '}
        <code style={{ fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap' }}>{lesson.variant.task.stdout.trimEnd()}</code>
      </p>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Your program ({LANGUAGE_LABELS[lesson.language]}){saved === 'saving' ? ' · saving draft…' : saved === 'saved' ? ' · draft saved' : ''}
        </span>
        <textarea value={code} onChange={(e) => onChange(e.target.value)} spellCheck={false} style={editor} aria-label="Program to fix" />
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" disabled={busy || !code.trim()} onClick={() => void run()}>
          {busy ? 'Running…' : 'Run and check'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => onChange(lesson.variant.task.starter)}>
          Reset to the starter
        </button>
        <button type="button" className={result?.correct ? 'btn btn-primary' : 'btn btn-quiet'} onClick={onContinue}>
          {result?.correct ? 'Try a different problem' : 'Skip to a different problem'}
        </button>
      </div>
      {result && <CheckResult result={result} label="Task result" />}
    </StepSection>
  );
}

/**
 * The statement, with the two constructions the corpus actually uses:
 * fenced code blocks and **bold**. Anything else is shown as written. The
 * web lock screen has a full renderer; this screen is not a code editor and
 * does not need one.
 */
function Statement({ markdown }: { markdown: string }) {
  const parts = markdown.split(/```[a-z]*\n?/);
  return (
    <div style={{ fontSize: 13, marginBottom: 10 }}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} style={{ ...codeBlock, margin: '6px 0' }}>
            <code>{part.replace(/\n$/, '')}</code>
          </pre>
        ) : (
          part
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((paragraph, j) => (
              <p key={`${i}-${j}`} style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
                {paragraph.split(/(\*\*[^*]+\*\*)/).map((piece, k) =>
                  piece.startsWith('**') && piece.endsWith('**') ? <strong key={k}>{piece.slice(2, -2)}</strong> : piece,
                )}
              </p>
            ))
        ),
      )}
    </div>
  );
}

function PracticeStep({ lessonId, language, onContinue }: { lessonId: string; language: Language; onContinue: () => void }) {
  const [practice, setPractice] = useState<LessonPracticeView | null>(null);
  const [error, setError] = useState<ReturnType<typeof describeError> | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [hint, setHint] = useState<HintView | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [accomplishment, setAccomplishment] = useState<Accomplishment | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const chimed = useRef<string | null>(null);

  const ticket = useRef(0);
  const load = useCallback(async () => {
    const mine = ++ticket.current;
    setError(null);
    try {
      const view = await api.learn.practice(lessonId, language);
      if (mine !== ticket.current) return;
      setPractice(view);
      setCode(readStored(draftKey(`${lessonId}.practice.${view.problem.id}`)) ?? view.problem.starterCode[language] ?? '');
      setGrade(null);
      setHint(null);
      setAccomplishment(null);
    } catch (err) {
      if (mine === ticket.current) setError(describeError(err, 'No practice problem could be chosen.'));
    }
  }, [lessonId, language]);

  useEffect(() => {
    void load();
    return () => {
      ticket.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (grade) resultRef.current?.focus();
  }, [grade]);

  // The success moment is the existing one: written just after the grade,
  // fetched by submission id, and shown with the surface rule the dashboard
  // uses. The chime waits for the surface, and only plays for a full one,
  // with sound on, and without a reduced-motion preference.
  useEffect(() => {
    if (!grade?.accepted) return;
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      while (!cancelled && tries < 8) {
        tries += 1;
        try {
          const { accomplishment: a, pending } = await api.accomplishment(grade.submissionId);
          if (a) {
            if (!cancelled) setAccomplishment(a);
            const full = (a.surface ?? 'full') === 'full';
            if (full && readCelebrationPrefs().sound && !reducedMotion() && chimed.current !== grade.submissionId) {
              chimed.current = grade.submissionId;
              chime();
            }
            return;
          }
          if (!pending) return;
        } catch {
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const submit = async () => {
    if (!practice) return;
    setBusy(true);
    setError(null);
    try {
      setGrade(await api.learn.submit({ problemId: practice.problem.id, language, sourceCode: code }));
    } catch (err) {
      setError(describeError(err, 'The submission failed.'));
    }
    setBusy(false);
  };

  const askHint = async (level?: number) => {
    if (!practice) return;
    setHintBusy(true);
    setError(null);
    try {
      setHint(
        await api.learn.hint({
          problemId: practice.problem.id,
          language,
          sourceCode: code,
          request: level ? 'level' : 'next',
          ...(level ? { level } : {}),
        }),
      );
    } catch (err) {
      setError(describeError(err, 'No hint could be built.'));
    }
    setHintBusy(false);
  };

  if (error && !practice) {
    return (
      <StepSection id="step-practice" title="A different problem">
        <p role="alert" style={{ margin: 0 }}>
          {error.text}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Try again
          </button>
          <button type="button" className="btn btn-quiet" onClick={onContinue}>
            Skip practice
          </button>
        </div>
      </StepSection>
    );
  }
  if (!practice) {
    return (
      <StepSection id="step-practice" title="A different problem">
        <p style={{ margin: 0, color: 'var(--faint)' }}>Choosing a problem…</p>
      </StepSection>
    );
  }

  return (
    <StepSection id="step-practice" title={`A different problem: ${practice.problem.title}`}>
      <p style={{ margin: '0 0 4px', color: 'var(--muted)' }}>{practice.fit}</p>
      <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>{practice.note}</p>
      <Statement markdown={practice.problem.promptMarkdown} />
      {practice.problem.sampleCases.length > 0 && (
        <details style={{ marginBottom: 10 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13 }}>Sample cases</summary>
          {practice.problem.sampleCases.map((c) => (
            <pre key={c.ordinal} style={{ ...codeBlock, marginTop: 6 }}>
              <code>{`input:\n${c.stdin}\nexpected:\n${c.expectedStdout}`}</code>
            </pre>
          ))}
        </details>
      )}
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Your solution ({LANGUAGE_LABELS[language]})</span>
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            writeStored(draftKey(`${lessonId}.practice.${practice.problem.id}`), e.target.value);
          }}
          spellCheck={false}
          style={{ ...editor, minHeight: 220 }}
          aria-label="Solution"
        />
      </label>
      {error && (
        <p role="alert" style={{ margin: '8px 0 0', color: error.kind === 'judge' ? 'var(--warning)' : 'var(--danger)' }}>
          {error.text}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" disabled={busy || !code.trim()} onClick={() => void submit()}>
          {busy ? 'Grading…' : 'Submit'}
        </button>
        <button type="button" className="btn btn-quiet" disabled={hintBusy} onClick={() => void askHint()}>
          {hintBusy ? 'Thinking…' : hint ? 'Another hint' : 'Hint (counts as help)'}
        </button>
        {hint && hint.nextLevel && !hintBusy && (
          <button type="button" className="btn btn-quiet" onClick={() => void askHint(hint.nextLevel!)}>
            {hint.nextLevel === 5 ? 'Show the worked solution (counts as help)' : 'More help'}
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={() => void load()}>
          A different problem
        </button>
        {grade?.accepted && (
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Finish the lesson
          </button>
        )}
      </div>

      {hint && (
        <div role="region" aria-label={`Hint, ${hint.levelLabel}`} style={{ marginTop: 10, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {hint.levelLabel}
          </p>
          {hint.notice && <p style={{ margin: '4px 0 0' }}>{hint.notice}</p>}
          {hint.explain && <p style={{ margin: '4px 0 0' }}>{hint.explain}</p>}
          {hint.body && <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{hint.body}</p>}
          {hint.tryThis && <p style={{ margin: '4px 0 0' }}>{hint.tryThis}</p>}
          {hint.code && (
            <pre style={{ ...codeBlock, marginTop: 6 }} aria-label={hint.code.label}>
              <code>{hint.code.text}</code>
            </pre>
          )}
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--faint)' }}>{hint.analysisNote}</p>
        </div>
      )}

      {grade && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          aria-label="Submission result"
          style={{ marginTop: 10, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', outline: 'none' }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>
            {grade.accepted
              ? 'Accepted.'
              : grade.correct
                ? 'Every test passed, but slower than the budget. It still counts as a practice solve; a faster approach would clear the gate.'
                : `${grade.passedCount} of ${grade.totalCount} tests passed.`}
          </p>
          {grade.message && (
            <pre style={{ ...codeBlock, marginTop: 6 }}>
              <code>{grade.message}</code>
            </pre>
          )}
          {grade.nearMiss && grade.nearMiss.passed > grade.nearMiss.previousPassed && (
            <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
              Closer than last time: {grade.nearMiss.passed} of {grade.nearMiss.total}, up from {grade.nearMiss.previousPassed}.
            </p>
          )}
          {!grade.correct &&
            grade.cases
              .filter((c) => !c.passed && c.stdin !== undefined)
              .slice(0, 2)
              .map((c) => (
                <pre key={c.ordinal} style={{ ...codeBlock, marginTop: 6 }} aria-label={`Case ${c.ordinal + 1}`}>
                  <code>{`case ${c.ordinal + 1}: ${c.status}\ninput:\n${c.stdin}${c.expectedStdout !== undefined ? `\nexpected:\n${c.expectedStdout}` : ''}\nyours:\n${c.actualStdout ?? '(nothing)'}${c.stderr ? `\n${c.stderr}` : ''}`}</code>
                </pre>
              ))}
          {accomplishment && (
            <div style={{ marginTop: 8 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>{accomplishment.headline}</p>
              {(accomplishment.surface ?? 'full') === 'full'
                ? accomplishment.details.slice(0, 3).map((d, i) => (
                    <p key={i} style={{ margin: '2px 0 0', color: 'var(--muted)' }}>
                      {d}
                    </p>
                  ))
                : accomplishment.details[0] && <p style={{ margin: '2px 0 0', color: 'var(--muted)' }}>{accomplishment.details[0]}</p>}
              <p style={{ margin: '2px 0 0', color: 'var(--muted)' }}>{accomplishment.helpSummary}</p>
            </div>
          )}
        </div>
      )}
    </StepSection>
  );
}
