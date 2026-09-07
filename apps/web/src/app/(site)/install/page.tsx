import type { Metadata } from 'next';
import { Reportage } from '@/components/site/reportage';
import Link from 'next/link';
import { hasRelease, releaseAsset, releasePageUrl, repoUrl } from '@/lib/releases';

export const metadata: Metadata = {
  title: 'Install',
  description: 'Run CodeLock privately on your own machine. Setup requirements, platform availability and unsigned build limitations.',
  robots: { index: true, follow: true },
};

const PLATFORMS = [
  { name: 'Windows', format: 'NSIS installer · .exe', detail: 'The desktop packaging path produces an unsigned installer. SmartScreen may warn, and Smart App Control can refuse installation. Check the installed binary rather than trusting an installer exit code. Signing and auto-update have not been exercised end to end.' },
  { name: 'macOS', format: 'Desktop build configuration', detail: 'Build configuration exists. macOS behavior has not been verified on hardware; do not treat it as a tested equivalent of the Windows build.' },
  { name: 'Linux', format: 'Desktop build configuration', detail: 'Build configuration exists. Linux behavior has not been verified on hardware.' },
  { name: 'Android', format: 'Native build required', detail: 'Expo Go cannot load the overlay module. A native build needs notifications, display-over-other-apps permission and a battery-optimisation exemption. The overlay has not been verified on a device.' },
];

export default function InstallPage() {
  const readme = `${repoUrl()}/blob/main/README.md`;
  return <>
    <section className="rule-b hero-stage"><div className="site-frame section-space">
      <p className="eyebrow">Install / Private by setup</p>
      <h1 className="display display-hero mt-6">Your machine.<br /><em>Your commitment.</em></h1>
      <p className="prose-site measure-wide mt-8">Free. Source available. No account required. CodeLock runs as a local stack for one person. The API deliberately does not authenticate requests, so keep every service off the public internet.</p>
      <div className="site-actions"><a href={`${readme}#setup`} className="site-button">Open the setup guide →</a><Link href="/limits" className="text-link">Read the limits first →</Link></div>
    </div></section>
    <div className="site-frame route-capture"><Reportage capture="codelock-app-dashboard-light" className="dashboard-crop" number="04" alt="CodeLock desktop dashboard with focus timer controls" caption="The desktop dashboard is where a focus block begins. The API, database and judge must be running before the shell can enforce the timer." /></div>
    <section className="rule-b"><div className="site-frame section-space mechanism-layout">
      <div><p className="eyebrow">01 / Prepare</p><h2 className="display display-md mt-4">A local stack,<br />then the shell.</h2></div>
      <div className="prose-site editorial-body">
        <p>You need <strong>Node.js 24, Docker Desktop and Git</strong>. The API, Postgres database and bundled judge run alongside the web app. Only the desktop shell enforces the desktop lock.</p>
        <ol className="setup-steps">
          <li>Install the repository dependencies and copy the API and web environment templates.</li>
          <li>Generate an unlock-signing secret. Set it in the API and give the desktop shell the matching secret, as described in the setup guide. The shell refuses to lock without its verification configuration.</li>
          <li>Start the stack, then initialise the database and problem set. The first start downloads database and language images.</li>
          <li>Calibrate reference runtimes on the same judge and hardware you will use, then launch the desktop shell.</li>
        </ol>
        <p>The <a href={`${readme}#setup`}>README contains the commands in order</a>, including configuration and database setup. Read them before running a reset on an existing installation.</p>
        <p><strong>No metered application APIs.</strong> Grading uses the bundled local judge. Electricity, hardware and any external services you independently keep can still cost money.</p>
      </div>
    </div></section>
    <section className="rule-b bg-surface-2/50"><div className="site-frame section-space">
      <p className="eyebrow">02 / Platform availability</p>
      <h2 className="display display-md mt-4">{hasRelease() ? 'Configured release downloads.' : 'Build from source for now.'}</h2>
      <p className="prose-site mt-5">{hasRelease() ? <>Review the <a href={releasePageUrl()!}>release notes and available assets</a> before installing.</> : <>No release is configured for this site. Follow the <a href={`${readme}#desktop-packaging-and-trusted-install`}>desktop packaging guide</a> to build the installer from source.</>}</p>
      <dl className="platform-ledger">{PLATFORMS.map(platform => <div key={platform.name}>
        <dt>{platform.name}<span className="block mt-2 font-mono text-xs font-normal text-muted">{platform.format}</span></dt>
        <dd>{platform.detail}</dd>
        <dd>{releaseAsset(platform.name) ? <a className="text-link" href={releaseAsset(platform.name)!}>Download for {platform.name} →</a> : <span className="font-mono text-xs text-muted">No download configured</span>}</dd>
      </div>)}</dl>
      <p className="prose-site"><strong>iOS has no hard lock.</strong> The module reports it as unsupported. Family Controls is not implemented.</p>
    </div></section>
    <section className="closing-band"><div className="site-frame section-space"><p className="eyebrow">Before the first timer</p><h2 className="display display-md mt-4">Know the way out.</h2><p className="prose-site mt-5">On desktop, hold Escape for ten seconds to leave a held session. It counts as a failed session. Keep the recovery instructions within reach while you verify your setup.</p><div className="site-actions"><Link href="/support" className="site-button">Recovery and support →</Link></div></div></section>
  </>;
}
