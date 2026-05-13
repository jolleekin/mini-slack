"use client";

import { TranslationKey, createTranslator } from "@mini-slack/i18n/index.ts";
import { createContext, use } from "react";

import type { AppCatalog, Locale } from "./index.ts";

interface I18nContextValue {
  locale: Locale;
  t: ReturnType<typeof createTranslator<AppCatalog>>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  catalog: AppCatalog;
  children: React.ReactNode;
}

export function I18nProvider({ locale, catalog, children }: I18nProviderProps) {
  const t = createTranslator(catalog);
  return <I18nContext value={{ locale, t }}>{children}</I18nContext>;
}

export function useTranslations(): I18nContextValue["t"];

export function useTranslations(
  namespace: keyof AppCatalog,
): (
  key: TranslationKey<AppCatalog[typeof namespace]>,
  params?: Record<string, unknown>,
) => string;

export function useTranslations(namespace?: keyof AppCatalog) {
  const ctx = use(I18nContext);
  if (!ctx)
    throw new Error("useTranslations must be used within <I18nProvider>");

  if (!namespace) return ctx.t;

  return (
    key: TranslationKey<AppCatalog[typeof namespace]>,
    params?: Record<string, unknown>,
  ) => ctx.t(`${namespace}.${key}` as Parameters<typeof ctx.t>[0], params);
}
