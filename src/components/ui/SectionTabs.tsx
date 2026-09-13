'use client';
import { Children, type ReactNode, useEffect, useId, useState } from 'react';

/** Keeps editor panels mounted so changing sections never discards unsaved work. */
export default function SectionTabs({
  labels,
  children,
}: {
  labels: string[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const panels = Children.toArray(children);
  useEffect(() => {
    function revealAnchor() {
      const target = document.getElementById(window.location.hash.slice(1));
      const panel = target?.closest('[role="tabpanel"]');
      if (!panel?.id.startsWith(`${id}-panel-`)) return;
      const index = Number(panel.id.slice(`${id}-panel-`.length));
      if (Number.isInteger(index)) {
        setActive(index);
        requestAnimationFrame(() => target?.scrollIntoView({ block: 'start' }));
      }
    }
    const initial = window.setTimeout(revealAnchor, 0);
    window.addEventListener('hashchange', revealAnchor);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('hashchange', revealAnchor);
    };
  }, [id]);
  return (
    <div className="sectioned-editor">
      <div className="sectioned-tabs" role="tablist" aria-label="Profile sections">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === 'ArrowRight') next = (index + 1) % labels.length;
              else if (event.key === 'ArrowLeft')
                next = (index - 1 + labels.length) % labels.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = labels.length - 1;
              else return;
              event.preventDefault();
              setActive(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          className="sectioned-panel"
          key={labels[index]}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={active !== index}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
