import { translationsLoaders } from "@/lib/i18n/landing/index.ts";

interface LocaleLayoutProps {
  children: React.ReactNode;
}

export function generateStaticParams() {
  return Object.keys(translationsLoaders).map((locale) => ({ locale }));
}

/**
 * Shared layout for all [locale]/(landing) and [locale]/(auth) routes.
 */
export default async function LocaleLayout({ children }: LocaleLayoutProps) {
  return children;
}
