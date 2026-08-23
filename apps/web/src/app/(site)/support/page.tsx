import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Common questions, how to get out if something goes wrong, and where to report a bug.',
  robots: { index: true, follow: true },
};

/**
 * Support.
 *
 * Recovery comes first, above the FAQ and above the release notes: someone
 * reading this at 2am with a screen they cannot dismiss needs the way out
 * without scrolling past a changelog.
 *
 * Two values stay configuration rather than content, for the same reason the
 * footer treats the contact address that way: a fork or a private deployment is
 * not this repository, and pointing its users at someone else's issue tracker
 * would be worse than saying nothing. The default is the canonical repo;
 * override it, or set it empty, and the page adjusts what it claims.
 */
const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ?? 'https://github.com/TommyDeLeon/codelock';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';

interface Entry {
  q: string;
  a: React.ReactNode;
}

const RECOVERY: Entry[] = [
  {
    q: 'The lock screen is up and I need out now.',
    a: (
      <>
        On desktop, <strong>hold Escape for ten seconds</strong>. The countdown appears on screen
        while you hold it. This resolves the session as abandoned, which counts as a failed session
        for the difficulty ladder — the exit is real, it is just not free.
      </>
    ),
  },
  {
    q: 'It says it cannot reach the server, and it will not unlock.',
    a: (
      <>
        That is deliberate. An unreachable server is never evidence that nothing is locked, so the
        desktop shell <strong>fails closed</strong> and keeps retrying rather than opening on a
        network error. The kill switch still works while it retries.
      </>
    ),
  },
  {
    q: 'I solved it, but the overlay will not come down.',
    a: (
      <>
        The shell could not verify the unlock signature, which almost always means it has no key
        configured. Check the console output at startup — it names the exact file to edit. A build
        with no key can never release a lock, so it warns at launch rather than at unlock time.
      </>
    ),
  },
  {
    q: 'Could I be locked out permanently?',
    a: (
      <>
        No. Beyond the kill switch, a lock has a <strong>twelve-hour maximum lifetime</strong> on
        disk — anything older is treated as debris and ignored on the next start — and every
        platform has its own documented escape, listed on the{' '}
        <Link href="/limits">limits page</Link>. Uninstalling always works.
      </>
    ),
  },
  {
    q: 'Android: I need it off and the overlay is covering everything.',
    a: (
      <>
        Pull down the status bar — system UI always draws above app overlays — then Settings → Apps
        → CodeLock → <strong>Force stop</strong>. Booting into Safe Mode also works, since
        third-party apps do not run there.
      </>
    ),
  },
];

const TROUBLESHOOTING: Entry[] = [
  {
    q: 'Windows warns me the installer is unsafe.',
    a: (
      <>
        Expected, and explained in full on the <Link href="/install">install page</Link>. The build
        is not signed by an authority Microsoft recognises. Click “More info”, then “Run anyway”.
      </>
    ),
  },
  {
    q: 'Android: the overlay never appears when the timer fires.',
    a: (
      <>
        Two likely causes. Either “Display over other apps” was never granted — Android only offers
        it from a Settings screen, never a dialog — or your phone&apos;s battery manager killed the
        foreground service. Xiaomi, Huawei, Samsung and OnePlus all do this; exempt CodeLock from
        battery optimisation.
      </>
    ),
  },
  {
    q: 'macOS asks for Accessibility permission every time I rebuild.',
    a: (
      <>
        macOS ties that grant to the app&apos;s code signature, and an ad-hoc signature differs on
        every build. Use a stable signing identity — even a free one — if you are iterating.
      </>
    ),
  },
  {
    q: 'Rebooting my computer got past the lock.',
    a: (
      <>
        A known gap, not a surprise. The lock state survives the reboot, but nothing launches
        CodeLock at login yet, so it is only re-applied when you next start the app. It is listed as
        defeated on the <Link href="/limits">limits page</Link> rather than quietly omitted.
      </>
    ),
  },
  {
    q: 'The editor is blank.',
    a: (
      <>
        The code editor needs JavaScript and local storage. Both are usually blocked by a strict
        privacy extension rather than by the browser itself.
      </>
    ),
  },
];

const FAQ: Entry[] = [
  {
    q: 'My solution is correct. Why am I still locked?',
    a: (
      <>
        Because correctness is not the bar. Your fastest of two runs has to come in under{' '}
        <code className="font-mono text-[13px]">best × 1.35 + 40ms</code>, so a working but
        quadratic answer stays locked and tells you how far off it is. The whole calculation is on{' '}
        <Link href="/how-it-works">how it works</Link>.
      </>
    ),
  },
  {
    q: 'Can I try it without an account?',
    a: (
      <>
        Yes — the <Link href="/demo">demo</Link> runs your code through the real judge and gives a
        real verdict, with no sign-up. It cannot lock anything, because a browser tab cannot.
      </>
    ),
  },
  {
    q: 'Does it watch what else I am doing?',
    a: (
      <>
        No. CodeLock can only see its own window. There is no keylogger, no screen capture and no
        record of which applications you use. What is stored is listed line by line on{' '}
        <Link href="/how-it-works">how it works</Link>.
      </>
    ),
  },
  {
    q: 'Is my code private?',
    a: (
      <>
        Submissions are stored against your account and run in a container with no network access.
        They are pushed to GitHub only if you connect it, and only to a repository you nominate.
      </>
    ),
  },
  {
    q: 'Can I run my own server?',
    a: (
      <>
        Yes, and it is the intended setup for a single user. The whole stack — database, API,
        sandbox and this site — comes up on one machine with one command, with automatic TLS and
        nightly backups.
      </>
    ),
  },
  {
    q: 'Why is there no iOS lock?',
    a: (
      <>
        Because iOS does not permit one. No public API lets an app block another, so CodeLock takes
        over its own screen and notifies you — and says exactly that rather than implying more.
      </>
    ),
  },
];

function Questions({ entries }: { entries: Entry[] }) {
  return (
    <dl className="rule-t">
      {entries.map((entry) => (
        <div key={entry.q} className="rule-b grid gap-x-10 gap-y-2 py-5 lg:grid-cols-[1fr_1.4fr]">
          <dt className="text-[15px] font-medium text-fg">{entry.q}</dt>
          <dd className="prose-site text-[14.5px]">{entry.a}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function SupportPage() {
  return (
    <>
      <section className="rule-b">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="eyebrow">Support</p>
          <h1 className="display display-lg measure-wide mt-5">
            Something went wrong,
            <br />
            or <em>you want out.</em>
          </h1>
          <div className="prose-site measure-wide mt-7 text-[15.5px]">
            <p>
              The way out is first, because if you are reading this with a screen you cannot dismiss
              you should not have to scroll past a changelog to find it.
            </p>
          </div>
        </div>
      </section>

      <section className="rule-b bg-accent-soft/40">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow text-accent">Getting out</p>
          <h2 className="display display-md mt-3">Recovery</h2>
          <div className="mt-6">
            <Questions entries={RECOVERY} />
          </div>
        </div>
      </section>

      <section className="rule-b">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow">Troubleshooting</p>
          <h2 className="display display-md mt-3">When it misbehaves</h2>
          <div className="mt-6">
            <Questions entries={TROUBLESHOOTING} />
          </div>
        </div>
      </section>

      <section className="rule-b bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="eyebrow">Questions</p>
          <h2 className="display display-md mt-3">Asked often enough</h2>
          <div className="mt-6">
            <Questions entries={FAQ} />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">Releases</p>
              <h2 className="display display-md mt-3">Nothing published yet.</h2>
              <div className="prose-site mt-5 text-[15px]">
                <p>
                  No release has been cut, so there is no version history to list and no changelog
                  that would not be fiction. When the first one lands it appears here and on the{' '}
                  <Link href="/install">install page</Link>, with checksums.
                </p>
                <p>Building from source works today and is the same code.</p>
              </div>
            </div>

            <div>
              <p className="eyebrow">Reporting a bug</p>
              <h2 className="display display-md mt-3">Tell someone.</h2>
              <div className="prose-site mt-5 text-[15px]">
                {REPO_URL ? (
                  <p>
                    Open an issue on <a href={`${REPO_URL}/issues`}>the issue tracker</a>. Include
                    your platform, what you expected, and what happened instead.
                  </p>
                ) : (
                  <p>
                    This deployment has not published an issue tracker. Whoever operates this
                    instance is the person to tell.
                  </p>
                )}
                <p>
                  If the API gave you an error it came with a <strong>request id</strong>. Quoting
                  that one string is the difference between finding your request in the logs and
                  searching an hour of traffic.
                </p>
                {CONTACT_EMAIL && (
                  <p>
                    Or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
