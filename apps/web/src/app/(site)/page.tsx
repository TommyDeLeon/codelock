import type { Metadata } from 'next';
import Link from 'next/link';
import { GateMeter } from '@/components/site/gate-meter';

export const metadata: Metadata = {
  title: { absolute: 'CodeLock — earn your screen time' },
  description:
    'A focus timer that locks your device until you solve a programming problem correctly and fast enough. Passing the tests is not sufficient.',
  robots: { index: true, follow: true },
};

/**
 * The landing page.
 *
 * Written as an argument rather than a brochure. The audience is developers who
 * already know they procrastinate and have been sold productivity software
 * before; the persuasive move is not adjectives but the mechanism, stated
 * plainly, with the limits admitted before anyone has to discover them.
 *
 * Hence: no feature triptych, no testimonials, no gradient. The strongest thing
 * this product has is a speed gate that is unusual and legible, so that gets the
 * hero and everything else is subordinate to it.
 */

const PLATFORM_LIMITS = [
  {
    platform: 'Desktop',
    detail: 'Kiosk overlay on every display, survives a kill, a crash and a reboot.',
    escape: 'Ctrl+Alt+Del or a power-off defeats it.',
  },
  {
    platform: 'Android',
    detail: 'A real overlay above other apps, restored after a reboot.',
    escape: 'Force-stop, Safe Mode or uninstall defeat it.',
  },
  {
    platform: 'iOS',
    detail: 'Takes over its own screen and notifies you.',
    escape: 'No app can block another. Not a limitation of ours.',
  },
  {
    platform: 'Browser',
    detail: 'Not a lock surface at all.',
    escape: 'A tab can always be closed.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* --- Hero ---------------------------------------------------------- */}
      <section className="dotfield hero-stage">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pb-36 sm:pt-32">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6 lg:pt-6">
              <p className="eyebrow hero-rise hero-rise-1">Focus timer · Desktop, Android, iOS</p>

              <h1 className="display display-hero hero-rise-headline hero-rise-2 mt-6">
                Your device stays locked
                until the code is{' '}
                <em>correct and fast.</em>
              </h1>

              <div className="prose-site measure hero-rise hero-rise-3 mt-8 text-[15px]">
                <p>
                  Set a timer. Work. When it fires, the screen belongs to CodeLock until you
                  solve the problem it assigns — and a solution that passes every test but runs
                  in quadratic time <strong>does not open the machine</strong>.
                </p>
              </div>

              <div className="hero-rise hero-rise-4 mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/demo"
                  className="inline-flex h-11 items-center rounded-md bg-fg px-5 text-[15px]
                             font-medium text-bg transition-colors hover:bg-fg/90"
                >
                  Try the lock screen
                </Link>
                <Link
                  href="/install"
                  className="inline-flex h-11 items-center rounded-md border border-border-strong
                             bg-surface px-5 text-[15px] font-medium transition-colors
                             hover:bg-surface-2"
                >
                  Download
                </Link>
                <span className="text-[13px] text-faint">No account needed.</span>
              </div>
            </div>

            {/* The instrument itself, not an illustration of one. */}
            <div className="hero-recede lg:col-span-6 lg:self-center lg:pt-2">
              <GateMeter />
              <p className="mt-3 text-[13px] text-faint">
                The same arithmetic the judge applies.{' '}
                <Link href="/demo" className="text-muted underline underline-offset-2">
                  Run your own code against it →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- The three ideas ----------------------------------------------- */}
      <section className="rule-t">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-12">
            <div className="rule-b py-10 lg:col-span-4 lg:border-b-0 lg:py-14 lg:pr-10">
              <p className="eyebrow">01 / The lock</p>
              <h2 className="display display-sm mt-3">The server decides, not the app.</h2>
              <div className="prose-site mt-4 text-[14.5px]">
                <p>
                  Clients never conclude they are unlocked. The API signs a token bound to one
                  user and one session, issued only after the judge passes and the speed gate
                  clears. The desktop shell verifies that signature in a process the web view
                  cannot reach.
                </p>
                <p>
                  Patch the front end, open the console, call the unlock channel by hand — the
                  signature fails and the overlay stays.
                </p>
              </div>
            </div>

            <div className="rule-b border-rule py-10 lg:col-span-4 lg:border-x lg:border-b-0 lg:px-10 lg:py-14">
              <p className="eyebrow">02 / The gate</p>
              <h2 className="display display-sm mt-3">Correct is not the bar.</h2>
              <div className="prose-site mt-4 text-[14.5px]">
                <p>
                  Your fastest of two runs has to come in under{' '}
                  <code className="font-mono text-[13px] text-fg">best × 1.35 + 40ms</code>,
                  measured inside the sandbox rather than around it, with a separate budget per
                  language.
                </p>
                <p>
                  Miss it and you get the number, not a shrug: <em>2.1× slower than the best
                  known solution</em>. The lock stays on. Write the better algorithm.
                </p>
              </div>
            </div>

            <div className="py-10 lg:col-span-4 lg:py-14 lg:pl-10">
              <p className="eyebrow">03 / The ladder</p>
              <h2 className="display display-sm mt-3">Difficulty you can predict.</h2>
              <div className="prose-site mt-4 text-[14.5px]">
                <p>
                  Two fast solves out of three moves you up. Two failures move you down. That is
                  the whole rule, and it is the rule the interface shows you.
                </p>
                <p>
                  No hidden score, no opaque model deciding your morning. You can always tell
                  what would happen next.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Limits, stated before they are discovered ---------------------- */}
      <section className="rule-t bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="eyebrow">Limits</p>
              <h2 className="display display-md mt-4">
                It is a commitment device,{' '}
                <em>not a parental control.</em>
              </h2>
              <div className="prose-site measure mt-5 text-[15px]">
                <p>
                  Every platform has a deliberate way out, and pretending otherwise would be the
                  fastest way to lose your trust the first time you found one.
                </p>
                <p>
                  The design goal is that none of them happens by reflex, and that the cheap
                  escapes cost you a recorded failure.
                </p>
              </div>
              <Link
                href="/limits"
                className="mt-6 inline-flex text-[14px] font-medium underline decoration-border-strong
                           underline-offset-4 hover:decoration-current"
              >
                Every escape we tried, and what worked →
              </Link>
            </div>

            <div className="lg:col-span-7">
              <dl className="rule-t">
                {PLATFORM_LIMITS.map((row) => (
                  <div
                    key={row.platform}
                    className="rule-b grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-6"
                  >
                    <dt className="font-mono text-[13px] text-fg">{row.platform}</dt>
                    <dd className="text-[14px] text-muted">
                      {row.detail} <span className="text-warning">{row.escape}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* --- Close --------------------------------------------------------- */}
      <section className="rule-t">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="display display-md">
                Install it, arm it,{' '}
                <em>then go and work.</em>
              </h2>
              <p className="prose-site measure mt-4 text-[15px]">
                CodeLock only makes sense installed. A tab you can close is not a lock, and we are
                not going to pretend otherwise.
              </p>
            </div>
            <Link
              href="/install"
              className="inline-flex h-11 shrink-0 items-center rounded-md bg-fg px-6 text-[15px]
                         font-medium text-bg transition-colors hover:bg-fg/90"
            >
              Get CodeLock
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
