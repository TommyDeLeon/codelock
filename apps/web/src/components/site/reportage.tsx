'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useTheme } from 'next-themes';

type Capture = 'codelock-app-lock' | 'codelock-verdict' | 'codelock-app-dashboard' | 'codelock-app-settings' | 'codelock-demo' | 'codelock-limits';

const imageSet = (name: string) => `image-set(url("/images/${name}.avif") type("image/avif"), url("/images/${name}.webp") type("image/webp"), url("/images/${name}.jpg") type("image/jpeg"))`;

/** CSS chooses the capture before hydration; React only updates the full-size
 * link. Unused custom-property URLs do not create a second image element. */
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

  return <figure className={`reportage ${className}`}>
    <a className="capture-link" href={`/images/${fullSize}.jpg`} target="_blank" rel="noreferrer" aria-label={`${alt}. Open full-size capture in a new tab`}>
      <span className="capture-image" data-capture={capture} style={images} role="img" aria-label={alt} />
    </a>
    <figcaption><span className="figure-number">Fig. {number}</span><span>{caption}</span><span className="capture-note">Actual capture / Open full size ↗</span></figcaption>
  </figure>;
}
