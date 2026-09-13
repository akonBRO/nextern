'use client';

import { useEffect, useRef } from 'react';

const openDialogs: symbol[] = [];
let previousOverflow = '';

/** Keyboard and focus behavior for the product's existing custom dialogs. */
export default function useDialog(open: boolean, onClose?: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const token = Symbol('dialog');
    const previousFocus = document.activeElement as HTMLElement | null;
    if (openDialogs.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs.push(token);
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex="0"]'
        ) ?? []
      ).filter((element) => element.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => (focusable()[0] ?? dialogRef.current)?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (event.key === 'Escape' && closeRef.current) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      const index = openDialogs.indexOf(token);
      if (index !== -1) openDialogs.splice(index, 1);
      if (openDialogs.length === 0) document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return dialogRef;
}
