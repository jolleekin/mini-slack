import { createTranslator } from "@mini-slack/i18n/index.ts";
import type { TranslationKey } from "@mini-slack/i18n/index.ts";

import { LOCALE_COOKIE_NAME } from "@/lib/constants.ts";

import type EnCatalog from "./locales/en.json";

const opts: ImportCallOptions = { with: { type: "json" } };

export const translationsLoaders = {
  en: () => import("./locales/en.json", opts).then((mod) => mod.default),
  fr: () => import("./locales/fr.json", opts).then((mod) => mod.default),
} as const;

export type Locale = keyof typeof translationsLoaders;
export type AppCatalog = typeof EnCatalog;
export type AppTranslationKey = TranslationKey<AppCatalog>;

const DEFAULT_LOCALE: Locale = "en";

export function extractLocale(headers: Headers): Locale {
  const cookieHeader = headers.get("cookie") ?? "";
  const cookieLocale = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1]
    ?.trim();

  if (cookieLocale && cookieLocale in translationsLoaders) {
    return cookieLocale as Locale;
  }

  const acceptLang = headers
    .get("Accept-Language")
    ?.split(",")[0]
    ?.split("-")[0];
  if (acceptLang && acceptLang in translationsLoaders) {
    return acceptLang as Locale;
  }

  return DEFAULT_LOCALE;
}

export async function loadTranslations(locale: Locale): Promise<AppCatalog> {
  return translationsLoaders[locale]() as Promise<AppCatalog>;
}

export async function getTranslator(headers: Headers) {
  const locale = extractLocale(headers);
  const catalog = await loadTranslations(locale);
  return { t: createTranslator(catalog), locale };
}
