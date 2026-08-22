import type { Metadata } from 'next';
import Link from 'next/link';

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

type Verdict = 'holds' | 'defeated' | 'intended';

interface Row {
  attempt: string;
  verdict: Verdict;
  note: string;
}

const DESKTOP: Row[] = [
  {
    attempt: 'Alt+F4, Ctrl+W, Ctrl+Q, window close',
    verdict: 'holds',
    note: 'Swallowed while locked, and the close event is cancelled regardless.',
  },
  {
    attempt: 'Minimise, Alt+Tab, Show desktop',
    verdict: 'holds',
    note: 'Kiosk mode keeps the window in front; losing focus pulls it straight back.',
  },
  {
    attempt: 'Switch virtual desktop',
    verdict: 'holds',
    note: 'The window is marked visible on all workspaces.',
  },
  {
    attempt: 'Use the second monitor',
    verdict: 'holds',
    note: 'Opaque covers on every other display, resynced when you plug one in mid-lock.',
  },
  {
    attempt: 'Sleep, wake, or lock the OS session',
    verdict: 'holds',
    note: 'Every barrier is re-asserted on resume rather than merely refocused.',
  },
  {
    attempt: 'Kill the process from Task Manager',
    verdict: 'holds',
    note: 'Lock state is on disk and the app relaunches itself while a lock is live.',
  },
  {
    attempt: 'Open DevTools and call the unlock channel',
    verdict: 'holds',
    note: 'The token is verified in the main process against a key the page cannot read.',
  },
  {
    attempt: 'Delete the lock file from AppData',
    verdict: 'defeated',
    note: 'By design. A deliberate two-step act with a file manager is above the bar this sets.',
  },
  {
    attempt: 'Reboot the machine',
    verdict: 'defeated',
    note: 'The lock file survives, but nothing launches CodeLock at login yet. A known gap.',
  },
  {
    attempt: 'Ctrl+Alt+Del, or hold the power button',
    verdict: 'defeated',
    note: 'The Secure Attention Sequence cannot be intercepted by any userland process, ever.',
  },
  {
    attempt: 'Hold Escape for ten seconds',
    verdict: 'intended',
    note: 'The documented kill switch. Resolves the session as abandoned, which counts as a failure.',
  },
];

const ANDROID: Row[] = [
  {
    attempt: 'Back button',
    verdict: 'holds',
    note: 'Swallowed by the overlay and by the in-app screen.',
  },
  {
    attempt: 'Home button, or open another app',
    verdict: 'holds',
    note: 'The overlay window sits above the launcher and above other apps.',
  },
  {
    attempt: 'Swipe the app away from Recents',
    verdict: 'holds',
    note: 'That kills the activity. The overlay belongs to a foreground service.',
  },
  {
    attempt: 'Reboot, or update the app',
    verdict: 'holds',
    note: 'A boot receiver restores the lock from storage.',
  },
  {
    attempt: 'Pull down the status bar',
    verdict: 'defeated',
    note: 'System UI always draws above application overlays, and Settings is reachable there.',
  },
  {
    attempt: 'Settings → Force stop',
    verdict: 'defeated',
    note: 'Documented. Only enterprise Device Owner provisioning prevents it, and that needs a factory reset.',
  },
  {
    attempt: 'Safe Mode, uninstall, or clear data',
    verdict: 'defeated',
    note: 'Third-party apps do not run, or the stored lock goes with them.',
  },
  {
    attempt: 'An OEM battery manager kills the service',
    verdict: 'defeated',
    note: 'Xiaomi, Huawei, Samsung, OnePlus. The app asks for an exemption; granting it is up to you.',
  },
];

const VERDICT_STYLE: Record<Verdict, { label: string; className: string }> = {
  holds: { label: 'holds', className: 'text-success' },
  defeated: { label: 'defeated', className: 'text-warning' },
  intended: { label: 'by design', className: 'text-muted' },
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
      <section className="rule-b">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="eyebrow">Limits</p>
          <h1 className="display display-lg measure-wide mt-5">
            Everything we tried,
            <br />
            and <em>what got through.</em>
          </h1>
          <div className="prose-site measure-wide mt-7 text-[15.5px]">
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

      <section className="rule-t bg-surface-2/50">
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

      <section className="rule-t">
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

      <section className="rule-t bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="display display-md measure-wide">
            So it is a commitment device,
            <br />
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
