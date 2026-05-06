"use client";

import { useRouter } from "next/navigation";
import { isSafeRedirectPath } from "@/proxy.ts";

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;

  // Validate the redirect param up-front so the post-auth handler can use it.
  const safeRedirect =
    redirect && isSafeRedirectPath(redirect) ? redirect : "/workspaces";

  return <SignInForm redirectTo={safeRedirect} />;
}

// ---------------------------------------------------------------------------
// Client component — handles post-authentication navigation
// ---------------------------------------------------------------------------

function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  /**
   * Call this after a successful authentication response.
   * Navigates to the validated redirect target (or /workspaces as fallback).
   */
  function handleAuthSuccess() {
    router.push(redirectTo);
  }

  // TODO: wire up the real auth UI here and call handleAuthSuccess() on success.
  void handleAuthSuccess; // referenced to avoid unused-variable lint errors

  return (
    <div>
      <h1 className="text-2xl font-semibold">Sign In</h1>
      <p className="text-muted-foreground mt-2">Sign in to your account.</p>
    </div>
  );
}
