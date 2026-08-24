import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'The speed gate arithmetic written out, the difficulty rule in full, and exactly what data leaves your machine.',
  robots: { index: true, follow: true },
};

/**
 * The mechanism, in full.
 *
 * Every number here is read from the code rather than remembered: PERF_TOLERANCE,
 * PERF_FLOOR_MS and PERF_BEST_OF from the API's environment schema,
 * PROMOTE_AFTER_FAST_SOLVES and DEMOTE_AFTER_FAILURES from
 * services/difficulty.ts. If those defaults are retuned, this page is wrong and
 * wants updating alongside them.
 *
 * The audience already knows what a focus timer is. What they do not know — and
 * what decides whether they trust this — is what the gate actually computes and
 * what leaves their machine.
 */

const DATA_ROWS: Array<{ what: string; where: string; tone: 'server' | 'local' | 'third' }> = [
  {
    what: 'Your submitted code',
    where:
      'Sent to the API and run in a throwaway container with no network. Stored against your account so your history is readable later.',
    tone: 'server',
  },
  {
    what: 'Session times and verdicts',
    where: 'Stored server-side. They are what the difficulty ladder is computed from.',
    tone: 'server',
  },
  {
    what: 'Your access token',
    where:
      'Held in browser local storage and sent only to the CodeLock API. On desktop the unlock key lives in the main process, where the page cannot read it.',
    tone: 'local',
  },
  {
    what: 'Which apps you use, what you type elsewhere',
    where: 'Never collected. CodeLock cannot see outside its own window.',
    tone: 'local',
  },
  {
    what: 'Accepted solutions',
    where:
      'Pushed to a GitHub repository you nominate — only if you connect it, and only on a pass.',
    tone: 'third',
  },
  {
    what: 'Your LeetCode username',
    where:
      'Sent to LeetCode to read your public profile — only if you link it. Nothing about your CodeLock activity goes the other way.',
    tone: 'third',
  },
];

const TONE_LABEL = {
  server: { text: 'server', className: 'text-muted' },
  local: { text: 'stays local', className: 'text-success' },
  third: { text: 'third party', className: 'text-warning' },
} as const;

const GATE_FACTS: Array<[string, string]> = [
  ['Tolerance', '1.35 — you may be 35% slower than the best known answer'],
  ['Floor', '40ms — added to every budget'],
  ['Runs', '2 — the faster one counts'],
  ['Within a run', 'The slowest test case is your time'],
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Above the fold, so a load reveal — a scroll-linked entry would
          already be finished before the first paint. */}
      <section className="rule-b hero-stage">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="eyebrow hero-rise hero-rise-1">How it works</p>
          <h1 className="display display-hero hero-rise-headline hero-rise-2 measure-wide mt-6">
            The arithmetic,{' '}
            <em>written out.</em>
          </h1>
          <div className="prose-site measure-wide hero-rise hero-rise-3 mt-8 text-[15.5px]">
            <p>
              Nothing here is a secret, and a lock you cannot reason about is a lock you will
              resent. Every threshold below is the default the code actually ships with.
            </p>
          </div>
        </div>
      </section>

      {/* --- 01 The lock --------------------------------------------------- */}
      <section className="rule-b section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">01 / The lock</p>
              <h2 className="display display-md mt-3">Nothing local decides.</h2>
            </div>
            <div className="prose-site text-[14.5px] lg:col-span-8">
              <p>
                You arm a timer. The server records the deadline, and every client renders its
                countdown from the server&apos;s clock rather than the machine&apos;s — so moving
                your system time buys nothing.
              </p>
              <p>
                <strong>The problem is chosen when the timer fires, not when you arm it.</strong>{' '}
                Otherwise you could read it during the focus block, which defeats the point.
              </p>
              <p>
                When you pass, the API issues a short-lived token signed against one user and one
                session. The desktop shell verifies that signature in its main process with a key
                the page cannot read. A patched front end, an injected script, or the console
                calling the unlock channel by hand all fail the check, and the overlay stays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 02 The gate --------------------------------------------------- */}
      <section className="rule-b bg-surface-2/50 section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">02 / The speed gate</p>
              <h2 className="display display-md mt-3">
                Correct, <em>and</em> fast.
              </h2>
              <p className="prose-site mt-4 text-[14.5px]">
                The part people find surprising, and the reason a working answer can leave you
                locked.
              </p>
            </div>

            <div className="lg:col-span-8">
              {/* The formula, given the weight it deserves. */}
              <div className="rule-t rule-b bg-bg px-5 py-6">
                <p className="font-mono text-[13px] leading-relaxed text-fg sm:text-[15px]">
                  budget = ceil(best × 1.35) + 40ms
                </p>
                <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-muted">
                  best = fastest accepted runtime for this problem, in your language
                </p>
              </div>

              <div className="prose-site mt-6 text-[14.5px]">
                <p>
                  <strong>Where your number comes from.</strong> Your code runs the whole suite
                  twice. Within one run, the slowest test case is that run&apos;s time — a solution
                  is only as fast as its worst input. Between runs, the faster one counts, so a
                  scheduler hiccup does not cost you the session.
                </p>
                <p>
                  <strong>Timing happens inside the container.</strong> Measuring around{' '}
                  <code className="font-mono text-[13px]">docker run</code> would include half a
                  second of image start-up that varies more than the algorithmic difference the
                  gate exists to detect — enough to make an O(n) and an O(n²) answer
                  indistinguishable.
                </p>
                <p>
                  <strong>The 40ms floor is not padding.</strong> On a problem whose best answer
                  takes 8ms, a 35% tolerance is a 3ms band — narrower than the judge&apos;s own
                  jitter. The floor keeps fast problems winnable.
                </p>
                <p>
                  <strong>The bar moves.</strong> When someone posts a faster accepted answer it
                  becomes the new <code className="font-mono text-[13px]">best</code>, and the
                  budget tightens for everyone, including them.
                </p>
              </div>

              <dl className="rule-t mt-6">
                {GATE_FACTS.map(([term, detail]) => (
                  <div key={term} className="rule-b grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="font-mono text-[12.5px] text-faint">{term}</dt>
                    <dd className="text-[14px] text-muted">{detail}</dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/demo"
                className="mt-6 inline-flex text-[14px] font-medium underline decoration-border-strong
                           underline-offset-4 hover:decoration-current"
              >
                Watch it reject a working solution →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- 03 The ladder ------------------------------------------------- */}
      <section className="rule-b section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">03 / Difficulty</p>
              <h2 className="display display-md mt-3">Two rules, both visible.</h2>
            </div>

            <div className="lg:col-span-8">
              <dl className="rule-t">
                <div className="rule-b py-5">
                  <dt className="text-[15px] font-medium text-fg">
                    Three fast solves in a row moves you up.
                  </dt>
                  <dd className="prose-site mt-2 text-[14.5px]">
                    A solve counts as fast when you finish inside the problem&apos;s own average
                    solve time. <strong>The streak is consecutive</strong> — one slow solve puts it
                    back to zero, and the counter in the app shows exactly where you stand.
                  </dd>
                </div>
                <div className="rule-b py-5">
                  <dt className="text-[15px] font-medium text-fg">
                    Two failed sessions in a row moves you down.
                  </dt>
                  <dd className="prose-site mt-2 text-[14.5px]">
                    Giving up counts as a failure, and so does the desktop kill switch. Easy is the
                    floor; you cannot fall off the bottom.
                  </dd>
                </div>
                <div className="py-5">
                  <dt className="text-[15px] font-medium text-fg">
                    Changing tier resets both counters.
                  </dt>
                  <dd className="prose-site mt-2 text-[14.5px]">
                    A streak belongs to the tier it was earned at. Arriving at Hard with two fast
                    solves banked would promote you out of it on your first success there.
                  </dd>
                </div>
              </dl>

              <p className="prose-site mt-6 text-[14.5px]">
                That is the entire ladder. It is a pure function of your history with no I/O and no
                model, which is why the interface can always tell you what would happen next rather
                than showing a score you cannot interrogate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 04 Data ------------------------------------------------------- */}
      <section className="rule-b bg-surface-2/50 section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">04 / Data</p>
              <h2 className="display display-md mt-3">What leaves your machine.</h2>
              <p className="prose-site mt-4 text-[14.5px]">
                A tool that interrupts your work has to be specific about this. CodeLock can only
                see its own window — it has no view of your other apps, and no keylogger.
              </p>
            </div>

            <div className="lg:col-span-8">
              <dl className="rule-t">
                {DATA_ROWS.map((row) => (
                  <div
                    key={row.what}
                    className="rule-b grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[1fr_6rem_1.5fr]"
                  >
                    <dt className="text-[14.5px] font-medium text-fg">{row.what}</dt>
                    <dd className={`font-mono text-[12px] ${TONE_LABEL[row.tone].className}`}>
                      {TONE_LABEL[row.tone].text}
                    </dd>
                    <dd className="text-[13.5px] leading-relaxed text-muted">{row.where}</dd>
                  </div>
                ))}
              </dl>

              <p className="prose-site mt-5 text-[14px]">
                No analytics, no third-party trackers, no cookies. Error reporting is off unless
                whoever runs your instance turns it on, and a self-hosted install sends nothing at
                all. The full statement is on the <Link href="/privacy">privacy page</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 05 Integrations ----------------------------------------------- */}
      <section className="rule-b section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow">05 / Integrations</p>
          <h2 className="display display-md mt-3">Both optional, both narrow.</h2>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="display display-sm">GitHub</h3>
              <div className="prose-site mt-3 text-[14.5px]">
                <p>
                  Accepted solutions are committed to a repository you nominate, so a month of
                  locks leaves something behind. CodeLock asks for{' '}
                  <code className="font-mono text-[13px]">public_repo</code> and never requests
                  access to private repositories.
                </p>
                <p>
                  Your token is encrypted at rest with AES-256-GCM under a key held in the
                  server&apos;s environment, never beside the ciphertext — a database dump on its
                  own is not enough to use it.
                </p>
                <p>
                  <strong>A failed push never keeps you locked.</strong> The commit is attempted
                  after the unlock token has already been issued, and a GitHub outage is logged and
                  dropped rather than propagated.
                </p>
              </div>
            </div>

            <div>
              <h3 className="display display-sm">LeetCode</h3>
              <div className="prose-site mt-3 text-[14.5px]">
                <p>
                  Link a username and CodeLock reads your public profile to seed a starting
                  difficulty, so you are not made to grind Easy problems you solved years ago.
                </p>
                <p>
                  It is read-only and one-directional: nothing about your CodeLock sessions is sent
                  to LeetCode. The endpoint is unofficial and occasionally changes, so the last
                  successful snapshot is cached and shown with its age when it breaks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="display display-md measure-wide">
            Now go and see it{' '}
            <em>refuse a working answer.</em>
          </h2>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center rounded-md bg-fg px-6 text-[15px]
                         font-medium text-bg transition-colors hover:bg-fg/90"
            >
              Try the demo
            </Link>
            <Link
              href="/limits"
              className="inline-flex h-11 items-center rounded-md border border-border-strong
                         bg-surface px-5 text-[15px] font-medium transition-colors hover:bg-surface-2"
            >
              What it cannot do
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
