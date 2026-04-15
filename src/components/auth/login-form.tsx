"use client";

import Link from "next/link";
import { useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm({
  configured,
  initialMessage = "",
  mode = "sign-in",
}: {
  configured: boolean;
  initialMessage?: string;
  mode?: "sign-in" | "sign-up";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isBusy, setIsBusy] = useState(false);
  const isSignUp = mode === "sign-up";

  async function signInWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Set Supabase environment variables before signing in.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsBusy(false);
    setMessage(error ? error.message : "Signed in. Refresh if the redirect does not happen automatically.");
    if (!error) {
      window.location.href = "/batches";
    }
  }

  async function signUpWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Set Supabase environment variables before registering.");
      return;
    }

    setIsBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      setMessage("Account created. Redirecting to your batches.");
      window.location.href = "/batches";
      return;
    }

    setMessage("Account created. Check your email to confirm the address before signing in.");
  }

  async function signInWithMagicLink() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Set Supabase environment variables before signing in.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsBusy(false);
    setMessage(error ? error.message : "Magic link sent. Check your email.");
  }

  async function signInWithGoogle() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Set Supabase environment variables before signing in.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsBusy(false);
    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="panel rounded-[28px] p-8">
      <div className="mb-6 space-y-2">
        <p className="eyebrow">Authenticate</p>
        <h1 className="text-4xl font-semibold tracking-[-0.05em]">
          {isSignUp ? "Create an account for batch editing" : "Sign in to manage image batches"}
        </h1>
        <p className="muted">
          {isSignUp ? "Register with email and password, or continue with Google." : "Use password login, magic links, or Google OAuth."}
        </p>
      </div>
      <form className="space-y-4" onSubmit={isSignUp ? signUpWithPassword : signInWithPassword}>
        <input
          className="field"
          disabled={!configured || isBusy}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />
        <input
          className="field"
          disabled={!configured || isBusy}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isSignUp ? "Create a password" : "Password"}
          type="password"
          value={password}
        />
        <button className="button button-primary w-full" disabled={!configured || isBusy} type="submit">
          {isSignUp ? "Create account" : "Sign in with password"}
        </button>
      </form>
      <div className={`mt-4 grid gap-3 ${isSignUp ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
        {!isSignUp ? (
          <button className="button button-secondary" disabled={!configured || isBusy || !email} onClick={signInWithMagicLink} type="button">
            Send magic link
          </button>
        ) : null}
        <button className="button button-secondary" disabled={!configured || isBusy} onClick={signInWithGoogle} type="button">
          {isSignUp ? "Register with Google" : "Continue with Google"}
        </button>
      </div>
      <div className="mt-4 space-y-3 text-sm muted">
        <p>{message || (isSignUp ? "A confirmed email account can sign in immediately after registration." : "Create the first user from Supabase Auth if password sign-in is enabled.")}</p>
        <p>
          {isSignUp ? "Already have an account? " : "Need an account? "}
          <Link className="underline underline-offset-4" href={isSignUp ? "/login" : "/register"}>
            {isSignUp ? "Sign in" : "Register"}
          </Link>
        </p>
      </div>
    </div>
  );
}
