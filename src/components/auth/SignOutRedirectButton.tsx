'use client';

import { signOut } from 'next-auth/react';
import { useState, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';

type SignOutRedirectButtonProps = {
  children: ReactNode;
  redirectTo?: string;
  style?: CSSProperties;
  onMouseOver?: MouseEventHandler<HTMLButtonElement>;
  onMouseOut?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  ariaLabel?: string;
};

export default function SignOutRedirectButton({
  children,
  redirectTo = '/',
  style,
  onMouseOver,
  onMouseOut,
  title,
  ariaLabel,
}: SignOutRedirectButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    if (isPending) return;

    setIsPending(true);

    try {
      await signOut({ redirect: false });
      window.location.assign(redirectTo);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      title={title}
      aria-label={ariaLabel}
      disabled={isPending}
      style={style}
    >
      {children}
    </button>
  );
}
