/**
 * The only module in the app that touches `window.localStorage`.
 *
 * Everything above it goes through `repositories/`, so replacing local storage
 * with `fetch` later is a change to one layer, not to every screen. Every call
 * is wrapped: storage throws in private mode and in sandboxed iframes, and a
 * missing preference is never worth breaking the app over.
 */

/** Bumped when a stored shape changes; mismatched payloads are discarded. */
export const STORAGE_VERSION = 1;

interface Envelope<T> {
  v: number;
  data: T;
}

function isEnvelope<T>(value: unknown): value is Envelope<T> {
  return typeof value === "object" && value !== null && "v" in value && "data" in value;
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    // Anything written by an older shape is dropped rather than guessed at.
    if (!isEnvelope<T>(parsed) || parsed.v !== STORAGE_VERSION) return fallback;
    return parsed.data;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, data: T): void {
  try {
    const envelope: Envelope<T> = { v: STORAGE_VERSION, data };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota or a blocked store. The session keeps working in memory.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing useful to do, and nothing worth surfacing.
  }
}
