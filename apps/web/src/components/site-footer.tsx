import Link from 'next/link';
import { CONTACT_EMAIL, MAINTAINER } from '@/lib/contact';

/** Shown without its scheme, "www." or trailing slash; the href keeps all three. */
const bare = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

/**
 * The colophon.
 *
 * This was a single word — "Contact" — in a row of legal links, which is where
 * you put an address you would rather nobody used. A publication names who made
 * it on the way out, so the channels are set as a ledger: the label in mono
 * because it is a field name, the value in the reading face because it is the
 * thing you actually want to read and copy. The address is legible on the page
 * rather than buried in an href.
 *
 * Every link here is its own tap target, sized to 44px.
 *
 * As plain inline text these were about 18px tall — inside WCAG 2.2's 24px
 * minimum (2.5.8) let alone the 44px enhanced bar (2.5.5), and small enough on
 * a phone that "Privacy" and "Terms" sit within one thumb of each other. The
 * height comes from the link itself rather than from padding on the row, so the
 * target and the thing the user can see are the same rectangle. min-w matters
 * as much as min-h: "Terms" renders 38px wide, which fails 2.5.5 on the other
 * axis even once the height is right.
 */
export function SiteFooter() {
  const channels = [
    { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
    { label: 'GitHub', value: bare(MAINTAINER.github), href: MAINTAINER.github, external: true },
    { label: 'LinkedIn', value: bare(MAINTAINER.linkedin), href: MAINTAINER.linkedin, external: true },
    { label: 'Portfolio', value: bare(MAINTAINER.site), href: MAINTAINER.site, external: true },
  ];

  return (
    <footer className="site-colophon mt-auto border-t border-border">
      <div>
        <div className="colophon-row">
          <div className="colophon-who">
            <p className="eyebrow">Built and maintained by</p>
            <p className="colophon-name">{MAINTAINER.name}</p>
          </div>

          <dl className="colophon-channels">
            {channels.map(c => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>
                  <a
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="colophon-legal">
          {/* Computed per render: a hard-coded year is wrong every January. */}
          <p>© {new Date().getFullYear()} CodeLock</p>
          <nav aria-label="Legal">
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
