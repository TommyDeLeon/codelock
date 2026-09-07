import type { Metadata } from 'next';
import { LegalPage, Section } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What a private CodeLock installation stores and where the data goes.',
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="7 September 2026">
      <Section heading="Scope">
        <p>
          CodeLock is currently a single-user application intended to run on your own computer or
          on a trusted private network. It has no sign-in system and its API does not authenticate
          callers. Do not expose the web app, API, database, or code-execution service to the public
          internet.
        </p>
      </Section>

      <Section heading="What is stored">
        <ul>
          <li>
            <strong>Local profile and settings</strong> — a fixed local-user record, display name,
            timezone, preferred language, timer schedule, and lock preferences. The database still
            contains columns and tables from the former account and integration design, but the
            current application has no account, password, OAuth, GitHub, or LeetCode flow.
          </li>
          <li>
            <strong>Learning activity</strong> — focus and lock sessions, assigned problems,
            submissions, submitted source code, runtimes, verdicts, progress, hints, debriefs, and
            the learning log.
          </li>
          <li>
            <strong>Operational logs</strong> — request identifiers, routes, response status, and
            errors written by the local API. The logger is configured to redact authorization
            headers and request bodies, including submitted source code.
          </li>
          <li>
            <strong>Device storage</strong> — the web, desktop, and mobile clients may keep local
            preferences and current lock state needed to resume the application.
          </li>
        </ul>
      </Section>

      <Section heading="Where data goes">
        <p>
          The supported configuration keeps application data in your Postgres database and sends
          submitted code only to CodeLock&apos;s bundled judge. The judge starts temporary Docker
          containers with networking disabled. CodeLock does not include analytics, advertising,
          payments, hosted AI selection, hosted Judge0, OAuth, or error-tracking integrations in
          the current runtime.
        </p>
        <p>
          Docker and the selected language images remain third-party software running on your
          machine. Installing dependencies or images can contact their package registries. Review{' '}
          <a className="underline underline-offset-4" href="https://www.docker.com/legal/privacy/">
            Docker&apos;s privacy policy
          </a>
          .
        </p>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          CodeLock does not currently provide an account-deletion button because there is no
          account. Data remains in the local Postgres volume until the operator deletes it. Remove
          the CodeLock database or its Docker volume to erase application records; also remove any
          separately copied database dumps and clear client storage on each device. Deleting a
          volume is irreversible, so inspect the target before doing it.
        </p>
        <p>
          If you previously created RapidAPI, OpenAI, Sentry, GitHub OAuth, Google OAuth, Render,
          Vercel, Neon, or similar accounts for an older CodeLock setup, removing keys from this
          repository does not cancel those services. Revoke their keys and OAuth grants, stop or
          delete their resources, remove saved payment methods where the provider permits it, and
          close the accounts from each provider&apos;s billing or account page. Check the provider&apos;s
          final invoice and confirmation email; CodeLock cannot do that on your behalf.
        </p>
      </Section>

      <Section heading="Cookies and tracking">
        <p>
          The current application has no advertising, analytics, or third-party tracking code.
          Browser storage used by the app stays under the CodeLock origin unless you export or
          clear it yourself.
        </p>
      </Section>

      <Section heading="Contact">
        {CONTACT_EMAIL ? (
          <p>
            Questions about this notice can be sent to{' '}
            <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . The person operating the installation controls its local data.
          </p>
        ) : (
          <p>
            No contact address is configured. The person operating the installation controls its
            local data.
          </p>
        )}
      </Section>
    </LegalPage>
  );
}
