import type { Metadata } from 'next';
import { Reportage } from '@/components/site/reportage';
import Link from 'next/link';
import { hasRelease, releasePageUrl, repoUrl } from '@/lib/releases';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get out of a held session, troubleshoot a local CodeLock installation, or report a problem.',
  robots: { index: true, follow: true },
};
const QUESTIONS = [
  { q: 'Every test passes. Why am I still locked?', a: 'Correctness is one condition. Your measured runtime must also meet the language-specific budget: best × 1.35 + 40ms. The faster of two timed runs counts. Calibrate on your own judge hardware if correct answers consistently miss the budget.' },
  { q: 'The API cannot be reached.', a: 'Check that the local API, database and judge are running. An unreachable API is not proof that a session has ended. On desktop, use the ten-second Escape exit if you need to leave the overlay while you repair the stack.' },
  { q: 'The desktop shell refuses to lock.', a: 'Check its configuration dialog. The desktop shell needs the same unlock-signing secret as the API, or the corresponding public key for RS256 verification. A shell without verification configuration deliberately refuses to lock.' },
  { q: 'The unsigned Windows installer did not install anything.', a: 'Smart App Control can refuse an unsigned build. Check Windows Security → App & browser control and verify the installed binary’s timestamp. A successful installer exit code alone is not evidence that the app was installed.' },
  { q: 'Reboot recovery or the Android overlay did not work.', a: 'Reboot recovery has not been verified on hardware, and Android has not been verified on a device. On Android, check overlay permissions and battery controls. Do not depend on either behavior until you have checked it on your own machine.' },
  { q: 'Where does my code go?', a: 'To your local API and bundled judge. Submissions and history are stored in your CodeLock database. There are no accounts, GitHub pushes, LeetCode connections or metered application APIs. Keep the stack on your machine or a trusted private network.' },
];

export default function SupportPage() {
  return <>
    <section className="rule-b hero-stage"><div className="site-frame section-space">
      {/* No kicker. "Need out? Start here." is already the plainest possible sign. */}
      <h1 className="display display-hero mt-6">Need out?<br /><em>Start here.</em></h1>
      <div className="recovery-lead"><p className="font-mono text-sm text-accent">DESKTOP / HOLD ESCAPE FOR 10 SECONDS</p><p className="prose-site mt-4">The overlay exits and the session counts as failed. That is an intentional recovery path, including when you need to repair your local setup.</p></div>
    </div></section>
    <div className="site-frame route-capture"><Reportage capture="codelock-app-settings" number="05" className="settings-crop" alt="CodeLock settings with permitted days, hours and default timer length" caption="The local settings define when CodeLock can interrupt: days, hours and the default block length. These scheduling controls are separate from the shell’s unlock-verification configuration." /></div>
    <section className="rule-b"><div className="site-frame section-space mechanism-layout">
      <div><p className="eyebrow">Other exits</p><h2 className="display display-md mt-4">The hardware<br />is still yours.</h2></div>
      <div className="prose-site"><p><strong>Android:</strong> pull down the status bar, open Settings → Apps → CodeLock → Force stop. Safe Mode, uninstall and revoked permissions also defeat the overlay.</p><p><strong>Windows:</strong> Ctrl+Alt+Del and ending the process defeat the lock. Relaunching CodeLock restores the stored lock; killing it does not erase the session.</p><p>The <Link href="/limits">full limits ledger</Link> distinguishes known escapes from behavior that is still unverified.</p></div>
    </div></section>
    <section className="rule-b bg-surface-2/50"><div className="site-frame section-space"><p className="eyebrow">Troubleshooting</p><h2 className="display display-md mt-4">Check the mechanism.</h2>
      <dl className="support-questions">{QUESTIONS.map(entry => <div key={entry.q}><dt>{entry.q}</dt><dd className="prose-site">{entry.a}</dd></div>)}</dl>
      <Link href="/how-it-works" className="text-link">The runtime calculation, explained →</Link>
    </div></section>
    <section><div className="site-frame section-space mechanism-layout">
      <div><p className="eyebrow">Report a problem</p><h2 className="display display-md mt-4">Leave a useful trail.</h2></div>
      <div className="prose-site"><p>Include your platform, the action you took, what you expected and what happened. If the API returned a request ID, include it. Leave secrets and submitted code out of public reports.</p>
      {repoUrl() ? <p><a href={`${repoUrl()}/issues`}>Open the issue tracker →</a></p> : <p>No issue tracker is configured. Check the source repository you used for this installation.</p>}
      {CONTACT_EMAIL && <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>}
      <p>{hasRelease() ? <a href={releasePageUrl()!}>Read the configured release notes.</a> : <>No release is configured here. See <Link href="/install">installation from source</Link>.</>}</p></div>
    </div></section>
  </>;
}
