'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { ArrowOut } from '@/components/ui/arrow-out';

type Capture = 'codelock-app-lock' | 'codelock-verdict' | 'codelock-app-dashboard' | 'codelock-app-settings' | 'codelock-demo' | 'codelock-limits';

const imageSet = (name: string) => `image-set(url("/images/${name}.avif") type("image/avif"), url("/images/${name}.webp") type("image/webp"), url("/images/${name}.jpg") type("image/jpeg"))`;

/** CSS chooses the capture before hydration; React only picks the full-size
 * source. Unused custom-property URLs do not create a second image element. */
export function Reportage({ capture, number, caption, alt, className = '' }: {
  capture: Capture; number: string; caption: string; alt: string; className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fullSize = `${capture}${mounted && resolvedTheme === 'dark' ? '' : '-light'}`;
  const images = {
    '--capture-light-jpg': `url("/images/${capture}-light.jpg")`,
    '--capture-dark-jpg': `url("/images/${capture}.jpg")`,
    '--capture-light': imageSet(`${capture}-light`),
    '--capture-dark': imageSet(capture),
  } as CSSProperties;

  // A native dialog, so Escape, the backdrop, focus containment and inerting
  // the page behind all come from the platform rather than from hand-written
  // keyboard code that would be one bug away from trapping someone inside it.
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const open = useCallback(() => { setOpened(true); dialog.current?.showModal(); }, []);
  const close = useCallback(() => dialog.current?.close(), []);

  return <figure className={`reportage ${className}`}>
    <button type="button" className="capture-link" onClick={open} aria-haspopup="dialog"
            aria-label={`${alt}. Open the full-size capture`}>
      <span className="capture-image" data-capture={capture} style={images} role="img" aria-label={alt} />
    </button>
    <figcaption>
      <span className="figure-number">Fig. {number}</span>
      <span>{caption}</span>
      <button type="button" className="capture-note" onClick={open} aria-haspopup="dialog">
        Actual capture / View full size <ArrowOut />
      </button>
    </figcaption>

    <dialog ref={dialog} className="capture-dialog" aria-label={alt}
            onClose={() => setOpened(false)}
            onClick={(event) => { if (event.target === dialog.current) close(); }}>
      {/* Mounted only while open, so six landing-page captures do not each
          preload a full-size JPEG nobody asked to see. */}
      {opened && <div className="capture-dialog-inner">
        <img src={`/images/${fullSize}.jpg`} alt={alt} />
        <div className="capture-dialog-bar">
          <span>Fig. {number} — {alt}</span>
          <button type="button" onClick={close} autoFocus>Close</button>
        </div>
      </div>}
    </dialog>
  </figure>;
}
