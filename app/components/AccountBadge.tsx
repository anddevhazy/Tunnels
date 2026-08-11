"use client";

import { useAuthContext } from "../lib/AuthProvider";

export default function AccountBadge() {
  const { user, signOutUser } = useAuthContext();

  if (!user) return null;

  const label = user.displayName || user.email || "signed in";

  return (
    <button
      className="account-badge"
      onClick={() => signOutUser()}
      title={`Signed in as ${label} — click to sign out`}
    >
      {user.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="account-badge__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="account-badge__avatar account-badge__avatar--fallback">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="account-badge__label">sign out</span>
    </button>
  );
}
