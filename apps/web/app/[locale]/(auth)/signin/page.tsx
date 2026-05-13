import { isSafeRedirectPath } from "@/proxy/shared.ts";
import { getTranslator } from "@/lib/i18n/landing/index.ts";
import type { Locale } from "@/lib/i18n/landing/index.ts";
import { SignInForm } from "./sign-in-form.tsx";

interface SignInPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const { redirect } = await searchParams;
  const safeRedirect =
    redirect && isSafeRedirectPath(redirect) ? redirect : "/app/workspaces";
  const { t } = await getTranslator(locale);

  return (
    <SignInForm
      redirectTo={safeRedirect}
      strings={{
        title: t("auth.signIn.title"),
        subtitle: t("auth.signIn.subtitle"),
        submitLabel: t("auth.signIn.submit"),
        loadingLabel: t("auth.signIn.loading"),
      }}
    />
  );
}
