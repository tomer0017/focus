import { readJson, writeJson } from "../lib/storage/localStore";

/**
 * A named slice of persisted state.
 *
 * The point of this interface is the swap that comes next: today `load` reads
 * local storage and `save` writes it; when the API lands the same call sites
 * become query + mutation, and no screen changes.
 */
export interface Repository<T> {
  load(): T;
  save(value: T): void;
}

/**
 * Local-storage repository with a seed and an optional migration.
 *
 * The seed is used on a first visit and whenever the stored payload was
 * written by an older schema version. It is a function so the mock data — which
 * generates dates relative to load time — is evaluated at read time.
 *
 * `migrate` runs on **every** load, over stored and seeded data alike. That is
 * deliberate: it is the one place where data written by an older build is
 * brought up to the current shape, and running it over the seed too means the
 * migration itself is exercised on a first visit rather than only months later
 * on somebody else's machine. Migrations must fill in defaults and must never
 * drop fields or change ids.
 */
export function createRepository<T>(
  key: string,
  seed: () => T,
  migrate?: (value: T) => T
): Repository<T> {
  return {
    load: () => {
      const value = readJson<T>(key, seed());
      return migrate ? migrate(value) : value;
    },
    save: (value: T) => writeJson(key, value),
  };
}
