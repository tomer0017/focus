import { useCallback, useState } from "react";
import type { Repository } from "../repositories";

/**
 * State that survives a refresh, backed by a repository.
 *
 * The initial value is read lazily, once, so every provider mounting does not
 * re-parse storage on every render. Writes go to state and to the repository
 * together: there is one source of truth per slice, and it is this hook.
 */
export function usePersistentState<T>(
  repository: Repository<T>
): [T, (updater: (current: T) => T) => void] {
  const [value, setValue] = useState<T>(() => repository.load());

  const update = useCallback(
    (updater: (current: T) => T) => {
      setValue((current) => {
        const next = updater(current);
        repository.save(next);
        return next;
      });
    },
    [repository]
  );

  return [value, update];
}
