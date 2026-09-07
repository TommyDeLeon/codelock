type Capture = 'codelock-app-lock' | 'codelock-verdict-light' | 'codelock-app-dashboard-light' | 'codelock-app-settings-light';

/** The original capture stays available at full size, including on a phone. */
export function Reportage({ capture, number, caption, alt, className = '' }: {
  capture: Capture; number: string; caption: string; alt: string; className?: string;
}) {
  return <figure className={`reportage ${className}`}>
    <a className="capture-link" href={`/images/${capture}.jpg`} target="_blank" rel="noreferrer" aria-label={`${alt}. Open full-size capture in a new tab`}>
      <picture>
        <source srcSet={`/images/${capture}.avif`} type="image/avif" />
        <source srcSet={`/images/${capture}.webp`} type="image/webp" />
        <img src={`/images/${capture}.jpg`} width={1600} height={capture === 'codelock-app-lock' ? 670 : 1000} alt={alt} loading="lazy" decoding="async" />
      </picture>
    </a>
    <figcaption><span className="figure-number">Fig. {number}</span><span>{caption}</span><span className="capture-note">Actual capture / Open full size ↗</span></figcaption>
  </figure>;
}
