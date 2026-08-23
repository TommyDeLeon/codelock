/**
 * Configuration read from the environment at request time.
 *
 * Server-only. Everything here runs in the Node process, never in the browser,
 * which is the whole point: `NEXT_PUBLIC_*` values are frozen into the client
 * bundle when the image is built, and the published image is built by CI that
 * cannot know your domain.
 *
 * Two names are accepted, in order:
 *
 *   1. `CODELOCK_API_URL` — the runtime one. Set it on the container and the
 *      same image serves any deployment.
 *   2. `NEXT_PUBLIC_API_URL` — the build-time one, still honoured so that
 *      `npm run dev` and locally built images keep working unchanged.
 */

const FALLBACK = 'http://localhost:4000';

/** The raw configured value, before validation. */
export function runtimeApiUrl(): string {
  // `||` not `??`: an unset Docker build arg arrives as the empty string, and
  // an empty base would make every request resolve against the page's own
  // origin — a 404 loop that looks like the API being down.
  return process.env.CODELOCK_API_URL || process.env.NEXT_PUBLIC_API_URL || FALLBACK;
}

/**
 * The API's origin, and only its origin.
 *
 * A path here would be silently ignored by a CSP directive, and a malformed
 * value would produce a policy that blocks everything — so a bad value falls
 * back rather than emitting something that fails in a way nobody can diagnose
 * from a browser console.
 */
export function apiOrigin(): string {
  try {
    return new URL(runtimeApiUrl()).origin;
  } catch {
    return FALLBACK;
  }
}
