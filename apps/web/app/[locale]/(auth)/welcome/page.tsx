import { getTranslator } from "@/lib/i18n/landing/index.ts";
import type { Locale } from "@/lib/i18n/landing/index.ts";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  const { t } = await getTranslator(locale);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("auth.welcome.title")}</h1>
      <p className="text-muted-foreground mt-2">{t("auth.welcome.subtitle")}</p>
    </div>
  );
}
