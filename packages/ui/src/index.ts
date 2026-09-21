/**
 * The interface both front ends share.
 *
 * It exists because the demo and the lock screen must not drift. The demo's
 * whole claim is that it is the real thing without the lock — same editor,
 * same problem panel, same results, same gate arithmetic — and the moment
 * those become two implementations, that claim quietly stops being true. They
 * were one set of components while both lived in one Next app; this package is
 * what keeps them one set now that the marketing site is its own deployment.
 *
 * What belongs here: presentational pieces with no knowledge of a session, a
 * lock, or an API client. What does not: anything that submits, polls, holds
 * an unlock token, or decides whether a screen may be released. The lock
 * screen keeps all of that, because the trust boundary is the API and the
 * shell — never a component someone could also render on a marketing page.
 */

export { cn, formatCompact, formatDuration, formatRelative } from './lib/utils';

/* Front-end configuration both surfaces read. One copy, so the contact address
   on a public page and the one in the app's own notices cannot disagree. */
export { CONTACT_EMAIL, MAINTAINER } from './lib/contact';

export { Button, type ButtonProps } from './components/ui/button';
export {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DifficultyBadge,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
} from './components/ui/primitives';
export { ArrowOut } from './components/ui/arrow-out';

export { CodeEditor } from './components/lock/code-editor';
export { ProblemPanel } from './components/lock/problem-panel';
export { TestResults } from './components/lock/test-results';
export { TestCaseRow, describeMismatch } from './components/lock/test-case-row';
export { SpeedGate } from './components/lock/speed-gate';
export { Standing } from './components/lock/standing';
