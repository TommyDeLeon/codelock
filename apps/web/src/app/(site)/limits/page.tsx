import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeField } from '@/components/site/code-field';

export const metadata: Metadata = {
  title: 'Limits',
  description:
    'Every way we could think of to get past a CodeLock lock, per platform, with what actually happens. A commitment device, not a parental control.',
  robots: { index: true, follow: true },
};

/**
 * The honest limits page.
 *
 * Kept deliberately close to docs/ESCAPE-MATRIX.md, which is the engineering
 * record of the same question. If the two ever disagree, the matrix is right
 * and this page is a marketing lie — so the wording is copied rather than
 * re-spun, and the rows that are untested say so.
 *
 * /terms states the same facts as legal prose. This is the explanatory version.
 */

/**
 * A verdict is what actually happened, not what the code intends to happen.
 *
 * 'untested' exists because it has to. Before this, the union was
 * holds | defeated | intended, so a row the matrix records as UNTESTED had
 * nowhere to go and was written as 'holds'. The page therefore claimed eleven
 * successful defences that nobody has ever observed. The comment above this
 * block already promised that the untested rows say so. They did not. They do
 * now.
 */
type Verdict = 'holds' | 'defeated' | 'intended' | 'untested';

interface Row {
  attempt: string;
  verdict: Verdict;
  note: string;
}

/*
  Verdicts below are copied from docs/ESCAPE-MATRIX.md, row for row. Where one
  line here covers several matrix rows it takes the weakest verdict of the set,
  because a row that is partly unproven is unproven.

  No desktop or Android row is currently 'holds'. That is not an oversight in
  this file, it is what the matrix says: every barrier is either defeated or
  written-but-not-exercised. 'holds' stays in the union so a row can earn it
  once it has actually been run.
*/
const DESKTOP: Row[] = [
  {
    // Matrix D1-D4.
    attempt: 'Alt+F4, Ctrl+W, Ctrl+Q, window close',
    verdict: 'untested',
    note: 'Swallowed while locked, and the close event is cancelled regardless.',
  },
  {
    // Matrix D5-D7.
    attempt: 'Minimise, Alt+Tab, Show desktop',
    verdict: 'untested',
    note: 'Kiosk mode keeps the window in front; losing focus pulls it straight back.',
  },
  {
    // Matrix D8.
    attempt: 'Switch virtual desktop',
    verdict: 'untested',
    note: 'The window is marked visible on all workspaces.',
  },
  {
    // Matrix D9-D11.
    attempt: 'Use the second monitor',
    verdict: 'untested',
    note: 'Opaque covers on every other display, resynced when you plug one in mid-lock.',
  },
  {
    // Matrix D12-D13.
    attempt: 'Sleep, wake, or lock the OS session',
    verdict: 'untested',
    note: 'Every barrier is re-asserted on resume rather than merely refocused.',
  },
  {
    // Matrix D15.
    attempt: 'Kill the process from Task Manager',
    verdict: 'untested',
    note: 'Lock state is on disk and the app relaunches itself while a lock is live.',
  },
  {
    // Matrix D14 and D22.
    attempt: 'Open DevTools and call the unlock channel',
    verdict: 'untested',
    note: 'The token is verified in the main process against a key the page cannot read.',
  },
  {
    // Matrix D16.
    attempt: 'Delete the lock file from AppData',
    verdict: 'defeated',
    note: 'By design. A deliberate two-step act with a file manager is above the bar this sets.',
  },
  {
    // Matrix D17. Recorded as untested there, but the gap is known and real:
    // nothing registers CodeLock at login, so a reboot ends the lock in
    // practice. Reported as defeated rather than untested, because erring
    // toward admitting an escape is the only safe direction for this page.
    attempt: 'Reboot the machine',
    verdict: 'defeated',
    note: 'The lock file survives, but nothing launches CodeLock at login yet. A known gap.',
  },
  {
    // Matrix D18 and D19.
    attempt: 'Ctrl+Alt+Del, or hold the power button',
    verdict: 'defeated',
    note: 'The Secure Attention Sequence cannot be intercepted by any userland process, ever.',
  },
  {
    // Matrix D21.
    attempt: 'Hold Escape for ten seconds',
    verdict: 'intended',
    note: 'The documented kill switch. Resolves the session as abandoned, which counts as a failure.',
  },
];

/*
  Android is untested throughout. The matrix is blunt about why: the native
  module is written but has never been compiled, there is no JDK or Android SDK
  on the development machine, and no EAS build has been run. Every non-defeated
  row here is a claim about code, not an observation.
*/
const ANDROID: Row[] = [
  {
    // Matrix A1.
    attempt: 'Back button',
    verdict: 'untested',
    note: 'Swallowed by the overlay and by the in-app screen.',
  },
  {
    // Matrix A2 and A4.
    attempt: 'Home button, or open another app',
    verdict: 'untested',
    note: 'The overlay window sits above the launcher and above other apps.',
  },
  {
    // Matrix A3.
    attempt: 'Swipe the app away from Recents',
    verdict: 'untested',
    note: 'That kills the activity. The overlay belongs to a foreground service.',
  },
  {
    // Matrix A6 and A7.
    attempt: 'Reboot, or update the app',
    verdict: 'untested',
    note: 'A boot receiver restores the lock from storage.',
  },
  {
    // Matrix A5.
    attempt: 'Pull down the status bar',
    verdict: 'defeated',
    note: 'System UI always draws above application overlays, and Settings is reachable there.',
  },
  {
    // Matrix A9.
    attempt: 'Settings → Force stop',
    verdict: 'defeated',
    note: 'Documented. Only enterprise Device Owner provisioning prevents it, and that needs a factory reset.',
  },
  {
    // Matrix A10 and A11.
    attempt: 'Safe Mode, uninstall, or clear data',
    verdict: 'defeated',
    note: 'Third-party apps do not run, or the stored lock goes with them.',
  },
  {
    // Matrix A12.
    attempt: 'An OEM battery manager kills the service',
    verdict: 'defeated',
    note: 'Xiaomi, Huawei, Samsung, OnePlus. The app asks for an exemption; granting it is up to you.',
  },
];

/*
  'untested' shares the muted colour with 'intended' on purpose. The only
  distinction that matters at a glance is that neither of them is the green of
  a defence that actually held, and the label carries the rest.
*/
const VERDICT_STYLE: Record<Verdict, { label: string; className: string }> = {
  holds: { label: 'holds', className: 'text-success' },
  defeated: { label: 'defeated', className: 'text-warning' },
  intended: { label: 'by design', className: 'text-muted' },
  untested: { label: 'untested', className: 'text-muted' },
};

function Matrix({ rows }: { rows: Row[] }) {
  return (
    <dl className="rule-t mt-6">
      {rows.map((row) => (
        <div
          key={row.attempt}
          className="rule-b grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[1fr_5.5rem_1.4fr]"
        >
          <dt className="text-[14.5px] font-medium text-fg">{row.attempt}</dt>
          <dd className={`font-mono text-[12.5px] ${VERDICT_STYLE[row.verdict].className}`}>
            {VERDICT_STYLE[row.verdict].label}
          </dd>
          <dd className="text-[13.5px] leading-relaxed text-muted">{row.note}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function LimitsPage() {
  return (
    <>
      <section className="rule-b hero-stage">
        <CodeField />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="eyebrow hero-rise hero-rise-1">Limits</p>
          <h1 className="display display-hero hero-rise-headline hero-rise-2 measure-wide mt-6">
            Everything we tried,
            and <em>what got through.</em>
          </h1>
          <div className="prose-site measure-wide hero-rise hero-rise-3 mt-8 text-[15.5px]">
            <p>
              On every platform there is a deliberate, conscious act that ends the lock. We would
              rather you read them here than find one at 2am and conclude the whole thing was
              oversold.
            </p>
            <p>
              The design goal is not that escape is impossible. It is that no escape happens by
              reflex, and that the cheap ones cost you a recorded failure.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="eyebrow">Desktop · Windows, macOS, Linux</p>
        <h2 className="display display-md mt-3">Electron kiosk shell</h2>
        <Matrix rows={DESKTOP} />
        <p className="mt-4 text-[13px] text-faint">
          Reasoned through in full and recorded in the repository; not every row has been exercised
          on real hardware yet, and macOS and Linux are untested.
        </p>
      </section>

      <section className="rule-t bg-surface-2/50 section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow">Android</p>
          <h2 className="display display-md mt-3">Overlay above other apps</h2>
          <Matrix rows={ANDROID} />
          <p className="mt-4 text-[13px] text-faint">
            Needs two permissions you grant by hand: “Display over other apps”, which Android only
            offers from a Settings screen, and a battery-optimisation exemption.
          </p>
        </div>
      </section>

      <section className="rule-t section-arrive">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">iOS</p>
              <h2 className="display display-md mt-3">
                It cannot block <em>anything.</em>
              </h2>
              <div className="prose-site mt-5 text-[15px]">
                <p>
                  No public API lets one iOS app prevent you leaving it or draw over another. This
                  is a decision Apple made, not a gap in our work, and no amount of effort here
                  changes it.
                </p>
                <p>
                  CodeLock takes over its own screen and notifies you. That is the ceiling. Any app
                  claiming a true iOS block is either using a request-gated parental-controls
                  entitlement or misrepresenting what it does. Pair it with Screen Time if you want
                  a hard limit.
                </p>
              </div>
            </div>

            <div>
              <p className="eyebrow">Browser</p>
              <h2 className="display display-md mt-3">
                A tab can <em>always</em> be closed.
              </h2>
              <div className="prose-site mt-5 text-[15px]">
                <p>
                  Which is exactly why the browser is not a lock surface. The demo on this site is a
                  demo — it never issues a real unlock, and it says so on screen the whole time.
                </p>
                <p>If a product tells you a web page can lock your computer, close the page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate rule-t bg-surface-2/50">
        <CodeField variant="close" />
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="display display-md measure-wide">
            So it is a commitment device,{' '}
            <em>not a parental control.</em>
          </h2>
          <p className="prose-site measure-wide mt-5 text-[15.5px]">
            If you want something that stops a determined person who owns the hardware, no userland
            application is that, and the ones that say otherwise are lying. CodeLock is for the case
            where the determined person is you, later, and you would like the easy path to be doing
            the work.
          </p>
          <Link
            href="/install"
            className="mt-8 inline-flex h-11 items-center rounded-md bg-fg px-6 text-[15px]
                       font-medium text-bg transition-colors hover:bg-fg/90"
          >
            Install it anyway
          </Link>
        </div>
      </section>
    </>
  );
}
