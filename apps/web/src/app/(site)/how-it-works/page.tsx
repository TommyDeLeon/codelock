import type { Metadata } from 'next';
import { Reportage } from '@/components/site/reportage';
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

const DATA_ROWS = [
  { what: 'Submitted code', where: 'Sent to your local API, run in a throwaway container with no network access, and stored in your CodeLock Postgres database.' },
  { what: 'Timers, verdicts and progress', where: 'Stored in the same local database, along with submissions and the learning log.' },
  { what: 'Unlock proof', where: 'Signed by the API. Verified by the desktop main process against the session being held.' },
  { what: 'External services', where: 'No account system, OAuth, GitHub sync or LeetCode connection. No OpenAI requests and no telemetry.' },
];

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
    <div className="site-frame route-capture"><Reportage capture="codelock-verdict" number="03" alt="A correct demo submission rejected for exceeding the runtime budget" caption="The two conditions diverge in this recorded run: all tests pass, but the measured runtime exceeds the budget. The demo produces a verdict, never an unlock token." /></div>

      {/* --- 01 The lock --------------------------------------------------- */}
      <section className="rule-b section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">01 / The lock</p>
              <h2 className="display display-md mt-3">The API decides.</h2>
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
                When both conditions pass, the API signs an unlock token. The desktop shell
                verifies the signature in its main process and checks that it names the held
                session. This separates the page from the unlock decision. It does not make
                the API safe to expose: it has no caller authentication.
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
                  <strong>The bar moves.</strong> When you submit a faster accepted answer it
                  becomes the new <code className="font-mono text-[13px]">best</code>, and the
                  budget tightens for your future attempts.
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
              <h2 className="display display-md mt-3">Where your data lives.</h2>
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
                    className="rule-b grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[1fr_2fr]"
                  >
                    <dt className="text-[14.5px] font-medium text-fg">{row.what}</dt>
                    <dd className="text-[13.5px] leading-relaxed text-muted">{row.where}</dd>
                  </div>
                ))}
              </dl>

              <p className="prose-site mt-5 text-[14px]">
                No telemetry and no metered application APIs. Keep the API and judge on your
                own machine or a trusted private network. CORS is a browser control, not
                authentication. See the <Link href="/privacy">privacy notice</Link> for data removal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate">
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
