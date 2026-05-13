"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/app/context.tsx";
import { translationsLoaders } from "@/lib/i18n/app/index.ts";
import type { Locale } from "@/lib/i18n/app/index.ts";

export default function LocaleSettingsPage() {
  const t = useTranslations("settings");
  const supportedLocales = Object.keys(translationsLoaders) as Locale[];
  const [selectedLocale, setSelectedLocale] = useState<Locale>(supportedLocales[0]);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    document.cookie = `locale=${selectedLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setSaved(true);
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{t("locale.title")}</h1>
      <p className="text-gray-11 mb-6">{t("locale.description")}</p>

      <div className="flex flex-col gap-4">
        <select
          value={selectedLocale}
          onChange={(e) => {
            setSelectedLocale(e.target.value as Locale);
            setSaved(false);
          }}
          className="border border-gray-6 rounded px-3 py-2 bg-gray-1 text-gray-12"
          aria-label={t("locale.title")}
        >
          {supportedLocales.map((loc) => (
            <option key={loc} value={loc}>
              {loc.toUpperCase()}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-accent-9 hover:bg-accent-10 text-white text-sm font-semibold transition-colors"
        >
          {t("locale.save")}
        </button>

        {saved && (
          <p className="text-sm text-success-11" role="status">
            {t("locale.saved")}
          </p>
        )}
      </div>
    </div>
  );
}
