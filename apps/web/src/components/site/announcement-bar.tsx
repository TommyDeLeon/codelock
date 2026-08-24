import Link from 'next/link';

/**
 * The promotional band across the top of every page.
 *
 * Borrowed from the large-retailer pattern the design direction now follows:
 * full-bleed brand colour, centred, one link.
 *
 * What it deliberately does not do is invent an offer. This product is free and
 * self-hosted, so there is no discount to advertise — the band carries the one
 * genuinely relevant thing the project has to say. A fabricated "30% off today
 * only" would be the retail aesthetic copied past the point where it means
 * anything, and this is a page about a tool that admits its own limits.
 *
 * The sentence is shortened on small screens rather than allowed to wrap. At
 * 390px the full version broke across three centred lines with "demo" stranded
 * alone on the second, which reads as a layout accident and pushed the header
 * and hero down the screen for no gain. The qualification it drops — that the
 * demo needs no account — is the first thing the demo page itself says.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-promo text-promo-fg">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 px-4 py-2 text-center text-[12.5px] font-semibold tracking-wide sm:px-8">
        <span className="sm:hidden">Free and open source</span>
        <span className="hidden sm:inline">
          Free and open source — no account required to try the demo
        </span>
        {/* Never let the call to action itself break in half. */}
        <Link
          href="/install"
          className="whitespace-nowrap underline underline-offset-2 hover:no-underline"
        >
          Get it running
        </Link>
      </p>
    </div>
  );
}
