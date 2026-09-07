import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The conditions and practical limits of using a private CodeLock installation.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="7 September 2026">
      <Section heading="Private local use">
        <p>
          CodeLock is currently built for one person on their own devices or a trusted private
          network. The API uses one local identity and does not authenticate requests. By running
          it, you accept responsibility for the computer, network, database, Docker daemon, and
          submitted code. Public or multi-user hosting is outside the supported use of this build.
        </p>
      </Section>

      <Section heading="What CodeLock does">
        <p>
          CodeLock runs a timer, then presents a programming problem. A supported lock client stays
          in front until the bundled judge reports that the submission passes the tests and its
          measured runtime is within the configured budget. It is a voluntary commitment tool, not
          a security boundary, parental-control system, or emergency-access control.
        </p>
      </Section>

      <Section heading="Platform limits and verification">
        <ul>
          <li><strong>Windows desktop:</strong> the main lock behavior has been exercised on Windows 11, but Ctrl+Alt+Del, power-off, another operating system, administrator action, or removing the application can defeat a user-space lock. Code signing and automatic updating have not been verified end to end.</li>
          <li><strong>macOS and Linux desktop:</strong> packaging configuration exists, but current lock behavior, signing, installation, permissions, and updating have not been verified on those platforms.</li>
          <li><strong>Android:</strong> overlay and foreground-service source exists, but it has not been compiled or tested on a device in the recorded project state. Even when working, force-stop, Safe Mode, uninstall, revoked permissions, or device-specific battery management can end the overlay.</li>
          <li><strong>iOS:</strong> the current native module reports hard locking as unsupported. CodeLock cannot claim to block other applications on iOS.</li>
          <li><strong>Browser:</strong> the lock route is advisory and the tab can be closed.</li>
        </ul>
        <p>
          Do not rely on CodeLock where delayed device access, a false unlock, or a failed lock
          could affect health, safety, employment, finances, legal obligations, or access to
          essential services.
        </p>
      </Section>

      <Section heading="Submitted code and the judge">
        <p>
          Submit only code you are entitled to use. Do not attempt to escape the execution
          container, access the Docker daemon, reach another system, exhaust the host, or interfere
          with another process. Container isolation reduces risk but does not make untrusted code
          harmless. The judge&apos;s Docker socket access is powerful enough to control its host, so
          the service must remain private.
        </p>
      </Section>

      <Section heading="No paid service promise">
        <p>
          The current supported runtime uses the bundled local judge and contains no payment flow.
          This does not cancel subscriptions or resources created through an older setup, and it
          cannot guarantee what an external provider may charge. You are responsible for reviewing
          and closing those accounts and for the ordinary cost of your own hardware, electricity,
          internet access, registries, app-store programs, or optional distribution certificates.
        </p>
      </Section>

      <Section heading="Software and corpus rights">
        <p>
          No general source-code licence is granted by this repository unless a separate software
          licence file is added. Problem content has separate terms described by the corpus
          licence and attribution notice. Do not assume that access to the repository grants a
          right to redistribute every file.
        </p>
      </Section>

      <Section heading="Availability and warranty">
        <p>
          CodeLock is a work in progress and is provided as is, without a promise that it is secure,
          lawful for every use, continuously available, or free of defects. Grading, timers,
          storage, installers, operating-system permissions, and containers can fail. To the extent
          permitted by applicable law, the operator and contributors disclaim warranties and are
          not responsible for losses caused by using or being unable to use the software. Some
          jurisdictions do not allow every limitation, so mandatory local law still applies.
        </p>
      </Section>

      <Section heading="Privacy">
        <p>
          The current data flow and deletion responsibilities are described in the{' '}
          <Link className="underline underline-offset-4" href="/privacy">privacy notice</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
