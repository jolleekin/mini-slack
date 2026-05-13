import { headers } from "next/headers";
import { I18nProvider } from "@/lib/i18n/app/context.tsx";
import { extractLocale, loadTranslations } from "@/lib/i18n/app/index.ts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = extractLocale(await headers());
  const catalog = await loadTranslations(locale);

  // Sidebar will be added in Milestone 4
  return (
    <I18nProvider locale={locale} catalog={catalog}>
      <div className="flex h-screen">{children}</div>
    </I18nProvider>
  );
}
