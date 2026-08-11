"use client";

import { useAuthContext } from "../lib/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready, configured, signIn } = useAuthContext();

  if (!configured) {
    return (
      <div className="page">
        <div className="gate">
          <span className="masthead__mark">◎</span>
          <h1 className="gate__title">FIREBASE NOT CONFIGURED</h1>
          <p className="gate__body">
            Add your Firebase project&apos;s web config to <code>.env.local</code> (see{" "}
            <code>.env.local.example</code>), enable the Google sign-in provider and Firestore in the
            Firebase console, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="page" aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className="page">
        <div className="gate">
          <span className="masthead__mark">◎</span>
          <h1 className="gate__title">TUNNELS</h1>
          <p className="gate__label">survey log — private to your account</p>
          <button className="gate__signin" onClick={() => signIn()}>
            Sign in with Google
          </button>
          <p className="gate__body">
            Your decisions and bores are stored under your Google account and only visible to you.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
