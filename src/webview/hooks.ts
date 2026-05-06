import { useEffect, useRef } from 'preact/hooks';

/**
 * useClickOutside — calls onOutside when a mousedown event lands outside
 * the returned ref's element OR Escape is pressed. Disabled when active=false.
 */
export function useClickOutside<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOutside(); };
    // Defer one tick so the same click that opens the menu doesn't close it.
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [active, onOutside]);
  return ref;
}
