"use client";

import { useRouter } from "next/navigation";

interface SignInFormStrings {
  title: string;
  subtitle: string;
  submitLabel: string;
  loadingLabel: string;
}

interface SignInFormProps {
  redirectTo: string;
  strings: SignInFormStrings;
}

export function SignInForm({ redirectTo, strings }: SignInFormProps) {
  const router = useRouter();

  function handleAuthSuccess() {
    router.push(redirectTo);
  }

  // TODO: wire up the real auth UI here and call handleAuthSuccess() on success.
  void handleAuthSuccess;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{strings.title}</h1>
      <p className="text-muted-foreground mt-2">{strings.subtitle}</p>
    </div>
  );
}
