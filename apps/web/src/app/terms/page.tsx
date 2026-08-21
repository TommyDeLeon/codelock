import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms you accept by using CodeLock, and the limits of what it can do.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="21 August 2026">
      <Section heading="What CodeLock does">
        <p>
          CodeLock runs a timer. When it expires, it presents a programming problem and keeps its
          lock screen in front until you submit a solution that passes every test case and runs
          within a time budget. It is a commitment device you choose to install.
        </p>
      </Section>

      <Section heading="What it cannot do">
        <p>
          Be clear about this before you rely on it. CodeLock is an ordinary application, not a
          kernel driver or a parental control:
        </p>
        <ul>
          <li>
            On <strong>desktop</strong>, Ctrl+Alt+Del, a forced power-off, or booting another
            operating system all get past it.
          </li>
          <li>
            On <strong>Android</strong>, force-stopping the app, Safe Mode, or uninstalling all get
            past it.
          </li>
          <li>
            On <strong>iOS</strong>, no application is permitted to block another. CodeLock controls
            only its own screen and sends notifications.
          </li>
          <li>
            In a <strong>browser</strong>, the tab can always be closed.
          </li>
        </ul>
        <p>
          Do not use CodeLock as a safety control, or in any situation where being unable to reach
          your device could cause harm.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          You are responsible for your credentials and for the code you submit. Do not submit code
          you are not entitled to share, and do not attempt to break out of the execution sandbox or
          use it to reach other systems.
        </p>
      </Section>

      <Section heading="Connected accounts">
        <p>
          If you connect GitHub, you authorise CodeLock to commit your accepted solutions to the
          repository you nominate, and those commits are public if the repository is. You can
          disconnect at any time, which deletes the stored token. LeetCode integration is read-only.
        </p>
      </Section>

      <Section heading="Availability and liability">
        <p>
          CodeLock is provided as is, without warranty. It may be unavailable, and grading depends
          on an execution service that can fail. To the extent permitted by law, the operator is not
          liable for lost work, missed deadlines, or any consequence of the lock screen appearing or
          failing to appear.
        </p>
      </Section>

      <Section heading="Privacy">
        <p>
          What is stored and who it is shared with is described in the{' '}
          <Link className="underline underline-offset-4" href="/privacy">
            privacy policy
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
