import type { Metadata } from 'next';
import Link from 'next/link';
import { hasRelease, releaseAsset, releasePageUrl, sourceUrl } from '@/lib/releases';

export const metadata: Metadata = {
  title: 'Install',
  description:
    'Install CodeLock on Windows, macOS, Linux and Android — with the security warnings explained honestly rather than hidden.',
  robots: { index: true, follow: true },
};

/**
 * The download page.
 *
 * Two rules it exists to follow:
 *
 *  1. **Never offer a download that does not exist.** No signed release has been
 *     published yet, so this page says so and gives the build-from-source path
 *     instead of a dead button. When a release is cut, `status` becomes
 *     'available' and the real asset URLs and checksums go in.
 *  2. **Explain the warning before the user meets it.** An unsigned installer
 *     makes Windows show a full-screen SmartScreen panel. Being surprised by
 *     that is how people conclude software is malware, so it is described here,
 *     including which two buttons to press, rather than glossed over.
 */

type Status = 'available' | 'unpublished' | 'blocked';

interface Platform {
  name: string;
  requirement: string;
  format: string;
  status: Status;
  /** What the user will actually see on first run, stated plainly. */
  warning: string | null;
  note: string;
}

const PLATFORMS: Platform[] = [
  {
    name: 'Windows',
    requirement: 'Windows 10 or 11, 64-bit',
    format: 'NSIS installer (.exe)',
    status: 'unpublished',
    warning:
      'Windows shows a blue “Windows protected your PC” panel, because the build is not signed by a certificate authority Microsoft recognises. Click “More info”, then “Run anyway”.',
    note: 'A self-signed certificate silences this on machines where you install that certificate yourself. Silencing it for everyone needs a certificate issued to a registered business entity, which is the real obstacle for a project this size.',
  },
  {
    name: 'macOS',
    requirement: 'macOS 12 or later, Intel or Apple silicon',
    format: 'Disk image (.dmg)',
    status: 'unpublished',
    warning:
      'Gatekeeper refuses to open an unnotarised app on first launch. Open System Settings → Privacy & Security and choose “Open Anyway”.',
    note: 'CodeLock asks for Accessibility permission to keep the lock window in front. macOS ties that grant to the app’s signature, so it has to be re-granted after an unsigned rebuild.',
  },
  {
    name: 'Linux',
    requirement: 'Any x86-64 distribution with FUSE',
    format: 'AppImage or .deb',
    status: 'unpublished',
    warning: null,
    note: 'Releases carry a detached GPG signature. Verify it before running anything that intends to take over your screen.',
  },
  {
    name: 'Android',
    requirement: 'Android 8.0 or later',
    format: 'Signed APK, direct install',
    status: 'unpublished',
    warning:
      'Android asks you to allow installs from your file manager, once. After that, signed updates install normally.',
    note: 'Not on the Play Store. An app that draws over other apps draws manual review, and direct installation is the honest fallback.',
  },
  {
    name: 'iOS',
    requirement: 'iOS 16.4 or later',
    format: 'TestFlight',
    status: 'blocked',
    warning: null,
    note: 'Needs a paid Apple Developer account to distribute at all, and iOS cannot block other apps regardless. Read the limits before deciding it is worth it.',
  },
];

/**
 * What the Download button does while no release exists.
 *
 * Not an apology — a path that works right now. Every command is complete and
 * in order, because "build from source" is only an answer if the reader does
 * not have to reconstruct it.
 */
/** A platform is only "available" when a real asset URL exists for it. */
function statusOf(platform: Platform): Status {
  if (platform.status === 'blocked') return 'blocked';
  return releaseAsset(platform.name) ? 'available' : 'unpublished';
}

function BuildFromSource() {
  const clone = sourceUrl();

  return (
    <section className="rule-b bg-warning-soft/60">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8">
          <p className="eyebrow shrink-0 text-warning">No binaries yet</p>
          <p className="prose-site text-[14.5px]">
            No signed release has been cut, so this page will not offer you a file that does not
            exist. Building it yourself takes about five minutes, needs Node 24, and produces
            exactly the same application.
          </p>
        </div>

        <pre className="mt-5 overflow-x-auto rounded-md border border-border bg-surface px-4 py-3.5 font-mono text-[12.5px] leading-relaxed">
{`${clone ? `git clone ${clone}
cd codelock
` : ''}npm install
npm run build
npm run dist -w @codelock/desktop`}
        </pre>

        <p className="prose-site mt-3 text-[13.5px] text-muted">
          The installer lands in <code className="font-mono text-[12.5px]">apps/desktop/release/</code>.
          {' '}Point it at your server by editing <code className="font-mono text-[12.5px]">config.json</code>{' '}
          in the app’s data directory on first run — it is created for you, and the app tells you
          where it is.
        </p>
      </div>
    </section>
  );
}

const STATUS_LABEL: Record<Status, { text: string; className: string }> = {
  available: { text: 'available', className: 'text-success' },
  unpublished: { text: 'not published yet', className: 'text-warning' },
  blocked: { text: 'unavailable', className: 'text-faint' },
};

export default function InstallPage() {
  return (
    <>
      <section className="rule-b">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="eyebrow">Install</p>
          <h1 className="display display-lg measure-wide mt-5">
            Get it onto
            <br />
            <em>the machine that distracts you.</em>
          </h1>
          <div className="prose-site measure-wide mt-7 text-[15.5px]">
            <p>
              CodeLock only works installed. A browser cannot lock anything, so there is no hosted
              version of the product — only the demo, and it tells you it is a demo.
            </p>
          </div>
        </div>
      </section>

      {hasRelease() ? (
        <section className="rule-b">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-baseline sm:gap-8 sm:px-8">
            <p className="eyebrow shrink-0 text-success">Released</p>
            <p className="prose-site text-[14.5px]">
              Pick your platform below. SHA-256 checksums for every asset are on the{' '}
              <a href={releasePageUrl()!} className="underline underline-offset-4">
                release page
              </a>
              . Verify them before running software that intends to take over your screen.
            </p>
          </div>
        </section>
      ) : (
        <BuildFromSource />
      )}

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rule-t">
          {PLATFORMS.map((platform) => (
            <article key={platform.name} className="rule-b py-7">
              <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[13rem_1fr]">
                <div>
                  <h2 className="display display-sm">{platform.name}</h2>
                  {/* Derived, not declared: the status cannot claim "available"
                      unless there is an asset URL to back it up. */}
                  <p
                    className={`mt-1 font-mono text-[12px] ${STATUS_LABEL[statusOf(platform)].className}`}
                  >
                    {STATUS_LABEL[statusOf(platform)].text}
                  </p>
                  <dl className="mt-4 space-y-1 text-[13px] text-faint">
                    <div>
                      <dt className="sr-only">Requirement</dt>
                      <dd>{platform.requirement}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Format</dt>
                      <dd className="font-mono">{platform.format}</dd>
                    </div>
                  </dl>
                </div>

                <div className="prose-site text-[14.5px]">
                  {releaseAsset(platform.name) && (
                    <p className="mb-4">
                      <a
                        href={releaseAsset(platform.name)!}
                        className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-[15px]
                                   font-medium text-accent-fg transition-opacity hover:opacity-90"
                      >
                        Download for {platform.name}
                      </a>
                      <span className="ml-3 font-mono text-[12px] text-faint">
                        {platform.format}
                      </span>
                    </p>
                  )}
                  {platform.warning && (
                    <p className="mb-3 border-l-2 border-warning pl-4 text-[14px] text-fg">
                      <strong className="font-semibold">What you will see: </strong>
                      {platform.warning}
                    </p>
                  )}
                  <p>{platform.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rule-t bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">Why the warnings</p>
              <h2 className="display display-md mt-3">
                We would rather explain it
                <br />
                <em>than hide it.</em>
              </h2>
              <div className="prose-site mt-5 text-[15px]">
                <p>
                  Operating systems warn about software from developers they cannot identify. That
                  warning is doing its job — it just cannot tell a solo project apart from
                  something hostile.
                </p>
                <p>
                  Silencing it costs money and, on Windows, a registered company. Until then the
                  warning stays, and the least we can do is tell you it is coming and exactly which
                  buttons to press.
                </p>
              </div>
            </div>

            <div>
              <p className="eyebrow">Before you install</p>
              <h2 className="display display-md mt-3">Read what it cannot do.</h2>
              <div className="prose-site mt-5 text-[15px]">
                <p>
                  Every platform has a way out, and on iOS there is effectively nothing but a
                  reminder. Knowing that beforehand is the difference between a tool you trust and
                  one you feel misled by.
                </p>
              </div>
              <Link
                href="/limits"
                className="mt-6 inline-flex h-11 items-center rounded-md border border-border-strong
                           bg-surface px-5 text-[15px] font-medium transition-colors hover:bg-surface-2"
              >
                See the limits
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
