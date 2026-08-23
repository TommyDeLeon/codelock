/**
 * Where the installers live.
 *
 * The Download buttons used to lead to a page that offered nothing, because no
 * release had been cut and the page refused — correctly — to link a file that
 * does not exist. The refusal was right; the dead end was not.
 *
 * So the asset URLs are derived from two build-time values instead of being
 * hard-coded. Set `NEXT_PUBLIC_RELEASE_TAG` once a release is published and the
 * buttons become real downloads with no code change. Leave it unset and the
 * page falls back to the build-from-source path, which works today.
 *
 * Nothing here fabricates a link: with no tag configured, `releaseAsset`
 * returns null and the caller has to render the fallback.
 */

const REPO_URL = (
  process.env.NEXT_PUBLIC_REPO_URL ?? 'https://github.com/TommyDeLeon/codelock'
).replace(/\/+$/, '');
const RELEASE_TAG = process.env.NEXT_PUBLIC_RELEASE_TAG || '';

/** The version stamped into the asset filenames, without the leading `v`. */
const version = RELEASE_TAG.replace(/^v/, '');

export const hasRelease = (): boolean => Boolean(REPO_URL && RELEASE_TAG);

export const repoUrl = (): string => REPO_URL;

export const releaseTag = (): string => RELEASE_TAG;

/** The release page itself — checksums and notes live there. */
export const releasePageUrl = (): string | null =>
  hasRelease() ? `${REPO_URL}/releases/tag/${RELEASE_TAG}` : null;

/**
 * The asset filenames electron-builder and EAS actually produce. Derived rather
 * than listed, so a version bump cannot leave one of them behind.
 */
const ASSET_NAMES: Record<string, (v: string) => string> = {
  Windows: (v) => `CodeLock-Setup-${v}.exe`,
  macOS: (v) => `CodeLock-${v}.dmg`,
  Linux: (v) => `CodeLock-${v}.AppImage`,
  Android: (v) => `CodeLock-${v}.apk`,
};

/** A direct download URL for one platform, or null when there is no release. */
export function releaseAsset(platform: string): string | null {
  const name = ASSET_NAMES[platform];
  if (!name || !hasRelease()) return null;
  return `${REPO_URL}/releases/download/${RELEASE_TAG}/${name(version)}`;
}

/** The clone URL for the build-from-source path. */
export const sourceUrl = (): string | null => (REPO_URL ? `${REPO_URL}.git` : null);
