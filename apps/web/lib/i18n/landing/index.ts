import { createTranslator } from "@mini-slack/i18n/index.ts";
import type { TranslationKey } from "@mini-slack/i18n/index.ts";

import type EnCatalog from "./locales/en.json";

const opts: ImportCallOptions = { with: { type: "json" } };

export const translationsLoaders = {
  en: () => import("./locales/en.json", opts).then((mod) => mod.default),
  fr: () => import("./locales/fr.json", opts).then((mod) => mod.default),
} as const;

export type Locale = keyof typeof translationsLoaders;
export type LandingCatalog = typeof EnCatalog;
export type LandingTranslationKey = TranslationKey<LandingCatalog>;

export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(value: string): value is Locale {
  return value in translationsLoaders;
}

export async function loadTranslations(
  locale: Locale,
): Promise<LandingCatalog> {
  return translationsLoaders[locale]() as Promise<LandingCatalog>;
}

export async function getTranslator(locale: Locale) {
  const catalog = await loadTranslations(locale);
  return { t: createTranslator(catalog), locale };
}
