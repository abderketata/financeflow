import { useEffect, useState } from 'react';

/**
 * Retarde la propagation d'une valeur : évite de relancer une requête serveur
 * à chaque frappe. Portage de `apps/web/src/hooks/useDebouncedValue.ts`.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}
