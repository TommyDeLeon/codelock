import type { Metadata } from 'next';
import { LegalPage, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What CodeLock stores, why, who it is shared with, and how to delete it.',
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="21 August 2026">
      <Section heading="What is stored">
        <ul>
          <li>
            <strong>Account</strong> — your email address, display name, timezone, and a hash of
            your password. Passwords are hashed with argon2id and are never stored or logged in a
            readable form.
          </li>
          <li>
            <strong>Activity</strong> — your focus sessions, which problems were assigned, the code
            you submitted, its runtime, and whether it passed.
          </li>
          <li>
            <strong>Connected accounts</strong> — if you connect GitHub, an access token encrypted
            at rest with AES-256-GCM and the repository you nominated. If you link LeetCode, your
            public username and a cached copy of your public stats.
          </li>
        </ul>
      </Section>

      <Section heading="Who it is shared with">
        <p>CodeLock does not sell data or use it for advertising. It is sent to:</p>
        <ul>
          <li>
            <strong>The code execution sandbox</strong> — your submitted code, so it can be run and
            graded. Submissions run with no network access.
          </li>
          <li>
            <strong>GitHub</strong>, only if you connect it, and only to commit accepted solutions
            to the repository you chose. CodeLock requests the <code>public_repo</code> scope and
            never asks for access to private repositories.
          </li>
          <li>
            <strong>LeetCode</strong>, only if you link a username, and only to read your public
            profile. Nothing is sent to LeetCode about your CodeLock activity.
          </li>
          <li>
            <strong>OpenAI</strong>, only if the operator has enabled hybrid problem selection. In
            that case problem titles and tags are sent — never your code, email, or submissions.
          </li>
        </ul>
      </Section>

      <Section heading="Payments">
        <p>
          CodeLock does not take payments. No card details are collected, stored, logged, or passed
          through its servers.
        </p>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          Data is kept while your account exists. Deleting your account removes your sessions,
          submissions, progress, and connected-account tokens; problems remain because they are
          shared and not yours. Disconnecting GitHub deletes the stored token immediately. Commits
          already pushed to your repository belong to you and are not touched.
        </p>
      </Section>

      <Section heading="Cookies and tracking">
        <p>
          CodeLock sets no cookies and runs no analytics or third-party trackers. Your session is
          held in your browser&apos;s local storage and is sent only to the CodeLock API.
        </p>
      </Section>

      <Section heading="Contact">
        {CONTACT_EMAIL ? (
          <p>
            For access, correction, or deletion requests, email{' '}
            <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        ) : (
          <p>
            This deployment has not published a contact address. Whoever operates this instance is
            the party to contact about your data.
          </p>
        )}
      </Section>
    </LegalPage>
  );
}
