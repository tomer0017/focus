/**
 * What counts as a link the app is allowed to send someone to.
 *
 * Placeholder hosts are the point of this module. A card that opens
 * `example.com/cooler` looks like a working link and is not one: it takes the
 * user out of the app and lands them on a parking page. A saved item with no
 * real destination simply has no `url`, and the UI shows an internal preview
 * instead of a link.
 */

/** Hosts reserved for documentation. Never a real destination. */
const PLACEHOLDER_HOSTS = [
  "example.com",
  "example.org",
  "example.net",
  "localhost.example",
];

/** Only these schemes may ever be opened from a card. */
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * True when `url` is something we can honestly open in a new tab.
 * Empty values, `#`, relative paths and placeholder hosts are all rejected.
 */
export function isExternalUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;

  const host = parsed.hostname.toLowerCase();
  return !PLACEHOLDER_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`));
}

/**
 * The value to store for a URL the user typed: the trimmed string when it is a
 * real destination, `undefined` otherwise. Storing a placeholder would just
 * reintroduce the bug on the next render.
 */
export function normaliseUrl(url: string | undefined | null): string | undefined {
  return isExternalUrl(url) ? url.trim() : undefined;
}

/** True for an image URL we are willing to put in an `<img src>`. */
export function isImageUrl(url: string | undefined | null): url is string {
  return isExternalUrl(url);
}
