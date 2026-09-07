import type { Metadata } from 'next';
import Link from 'next/link';
import { GateMeter } from '@/components/site/gate-meter';
import { Reportage } from '@/components/site/reportage';

export const metadata: Metadata = {
  title: { absolute: 'CodeLock — correct is only half the answer' },
  description: 'A private, single-user focus timer. Unlock with code that passes every test and meets a runtime budget. Free, source available, no account required.',
  robots: { index: true, follow: true },
};

const PLATFORM_LIMITS = [
  { platform: 'Desktop', detail: 'Electron kiosk shell. Lock state is restored on relaunch; reboot recovery remains unverified.', escape: 'Ctrl+Alt+Del, ending the process, or a power-off defeats it.' },
  { platform: 'Android', detail: 'Native overlay and boot receiver exist. Not yet verified on a device.', escape: 'Force-stop, Safe Mode, uninstall, or revoked permissions defeat it.' },
  { platform: 'iOS', detail: 'No hard lock. CodeLock reports it as unsupported.', escape: 'No app can block another through CodeLock. Family Controls is not implemented.' },
  { platform: 'Browser', detail: 'A place to try the interface, not a lock surface.', escape: 'A tab can always be closed.' },
];

export default function LandingPage() {
  return <>
    <section className="landing-hero site-frame">
      {/*
        No edition line above the headline.

        It read "A private, single-user commitment device / Focus / Code /
        Return" — masthead furniture, and still a label announcing the heading
        beneath it. "Correct is only half the answer." is the product's entire
        argument in six words; anything set above it is a hedge against the
        possibility that it does not land, and it lands.

        The description was not lost: it is the page's meta description and the
        first thing the mechanism section says.
      */}
      <h1 className="display">Correct is only<br /><em>half the answer.</em></h1>
      <div className="hero-deck">
        {/*
          The space before the <br> is load-bearing.

          site.css hides this break at the phone breakpoint so the line can set
          naturally, and with no whitespace in the markup the two halves fused
          into "Your next breakhas a condition." A trailing space collapses
          harmlessly at the end of a line when the break IS rendered, and is the
          only thing separating the words when it is not.
        */}
        <p className="hero-standfirst">Your next break <br />has a condition.</p>
        <div className="hero-copy"><p className="prose-site">Set a focus timer. When it expires, CodeLock takes the screen. The way back is code that passes every test <strong>and meets the runtime budget.</strong></p><div className="site-actions"><Link href="/demo" className="site-button">Try the mechanism <span aria-hidden>↗</span></Link><Link href="/how-it-works" className="text-link">Read how it works →</Link></div></div>
        <p className="hero-facts">Free<br />Source available<br />No account required<br />No metered application APIs</p>
      </div>
    </section>
    <section className="lock-spread" aria-label="The desktop lock, documented">
      <div className="spread-heading site-frame"><p className="eyebrow">01 / The interruption</p><p>The timer ends. The problem begins.</p></div>
      <Reportage capture="codelock-app-lock" number="01" alt="CodeLock desktop lock with a programming problem on the left and an editor on the right" caption="The desktop shell gives the display to a problem and an editor. This is the lock surface; a browser tab cannot enforce it." />
    </section>
    <section className="site-frame section-space argument-spread">
      <div className="argument-heading"><p className="eyebrow">02 / The condition</p><h2 className="display display-lg">It works.<br /><em>It is still<br />too slow.</em></h2><p className="prose-site">Correct output answers one question. The runtime budget asks another: did you find an efficient way to get there?</p><Link href="/how-it-works" className="text-link">Read the arithmetic →</Link></div>
      <div className="verdict-evidence"><Reportage capture="codelock-verdict" number="02" className="verdict-crop" alt="Demo verdict: all three tests passed, but 420 milliseconds exceeds the 189 millisecond budget" caption="Three tests passed. At 420ms against a 189ms budget, this captured demo run is rejected as too slow. Correctness alone does not clear the gate." /><p className="evidence-footnote">The capture records one run, not a benchmark for your machine. Reference runtimes are calibrated per language on your own judge hardware.</p></div>
    </section>
    <section className="gate-spread site-frame section-space">
      <div><p className="eyebrow">03 / Try the arithmetic</p><h2 className="display display-lg">A threshold.<br /><em>Not a feeling.</em></h2><p className="prose-site">The default budget is best × 1.35 + 40ms, rounded up to a whole millisecond. Of two timed runs, the faster one counts.</p></div>
      <div className="hero-instrument"><div className="instrument-heading"><span>The unlock condition</span><span>Illustrative runs</span></div><GateMeter /><p className="instrument-caption">All three examples pass the tests. Only one clears the gate. Select an attempt to compare; these timings illustrate the calculation.</p></div>
    </section>
    <section className="site-frame section-space mechanism-layout">
      <div><p className="eyebrow">04 / Who decides</p><h2 className="display display-lg">The page does<br />not get a vote.</h2></div>
      <div className="mechanism-proof"><p className="proof-line"><span>Every test passes</span><span className="proof-and">AND</span><span>Runtime ≤ budget</span></p><h3 className="proof-result">The API signs the session’s unlock token.</h3><p className="prose-site">The desktop shell checks the signature and the session it belongs to. The page cannot simply declare itself unlocked.</p><p className="prose-site">The API does not authenticate requests. Keep the entire stack on your machine or a trusted private network, off the public internet. This is a commitment device for its owner.</p></div>
    </section>
    <section className="limits-band site-frame section-space">
      <div className="section-intro"><p className="eyebrow">05 / The limits, before you install</p><h2 className="display display-lg">A commitment.<br /><em>Not a cage.</em></h2><p className="prose-site">Every platform has a way out. The purpose is to make returning to the work a deliberate choice. The hardware is still yours.</p></div>
      <dl className="platform-ledger">{PLATFORM_LIMITS.map(row => <div key={row.platform}><dt>{row.platform}</dt><dd>{row.detail}</dd><dd>{row.escape}</dd></div>)}</dl><Link href="/limits" className="text-link">The complete escape ledger, including unverified behavior →</Link>
    </section>
    <section className="closing-band site-frame section-space">{/* No kicker here. The numbered eyebrows above encode a real sequence and earn their place; this one labelled nothing and merely announced the heading under it, which the heading does perfectly well by itself. */}<h2 className="display">Put a problem<br /><em>in the way.</em></h2><div className="site-actions"><Link href="/install" className="site-button">Install CodeLock ↗</Link><span className="text-muted">Free. Source available. Yours to run privately.</span></div></section>
  </>;
}
