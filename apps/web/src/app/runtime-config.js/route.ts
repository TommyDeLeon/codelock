import { apiOrigin } from '@/lib/runtime-config';

/**
 * The API origin, decided at request time rather than at build time.
 *
 * `NEXT_PUBLIC_*` is inlined into the client bundle when the image is built,
 * which is fine for a bundle you build yourself and wrong for one you pull. The
 * published image is built by CI, which cannot know anyone's domain — so every
 * deployment using the prebuilt image shipped a bundle pointing at
 * `http://localhost:4000`, and every visitor's browser called their own
 * machine. The failure is silent: the page renders, and nothing works.
 *
 * A route handler is the smallest fix that keeps the image portable. The layout
 * loads it as a blocking script, so the global exists before any client code
 * runs, and the response is regenerated per request from the container's
 * environment. No entrypoint script, no rebuild per deployment.
 */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  // JSON.stringify rather than template interpolation: the value comes from the
  // environment, and an unescaped quote in it would be script injection into
  // every page of the site.
  const body = `window.__CODELOCK__=Object.freeze(${JSON.stringify({ apiUrl: apiOrigin() })});`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // Never cached. A cached copy would survive repointing the deployment at
      // a different API, which is the one thing this file exists to allow.
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
